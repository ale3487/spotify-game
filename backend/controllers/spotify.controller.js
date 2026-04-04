/**
 * @file spotify.controller.js
 * @description Controller principale per la gestione dell'integrazione Spotify.
 * Gestisce il flusso OAuth2 PKCE, la persistenza del profilo utente su Firestore,
 * la generazione di sessioni JWT e il recupero delle statistiche (Top Artists/Tracks) con caching.
 */

import fetch from "node-fetch";
import { db, admin } from "../firebase.js";
import jwt from "jsonwebtoken";
import { getValidAccessToken } from "../service/spotifyService.js";

/**
 * Gestisce il callback di autenticazione Spotify.
 * Scambia il 'code' con i token, salva l'utente su Firestore e imposta il cookie di sessione.
 */
export const loginSpotify = async (req, res) => {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI, JWT_SECRET, NODE_ENV } = process.env;

  if (!JWT_SECRET) {
    console.error("[CRITICAL] JWT_SECRET non configurato nel file .env");
  }

  const encodeBasicAuth = () =>
    Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");

  const { code, code_verifier } = req.body;
  if (!code || !code_verifier)
    return res.status(400).json({ error: "Codice o verifier mancanti." });

  try {
    // 1. Richiesta Token a Spotify
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      client_id: SPOTIFY_CLIENT_ID,
      code_verifier,
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodeBasicAuth()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const tokenData = await response.json();
    if (tokenData.error) return res.status(400).json(tokenData);

    const { access_token, refresh_token, expires_in } = tokenData;

    // 2. Recupero dati Profilo
    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = await profileRes.json();

    // 3. Persistenza Utente su Firestore
    await db.collection("users").doc(profile.id).set({
      spotifyId: profile.id,
      username: profile.display_name,
      email: profile.email,
      images: profile.images[0] || null,
      // Avatar casuale se l'utente non ha una foto profilo Spotify
      defaultAvatarId: profile.images.length === 0 ? Math.floor(Math.random() * 5) + 1 : null,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: Date.now() + expires_in * 1000,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. Generazione Sessione JWT
    const userData = {
      spotifyId: profile.id,
      display_name: profile.display_name,
      email: profile.email,
      images: profile.images || null,
    };

    const sessionToken = jwt.sign(userData, JWT_SECRET, { expiresIn: "7d" });

    // 5. Configurazione Cookie HttpOnly
    res.cookie("session_token", sessionToken, {
      httpOnly: true, 
      secure: NODE_ENV === "production", 
      sameSite: "Lax", 
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    res.json(userData);

  } catch (err) {
    console.error("[CONTROLLER ERROR] Login fallito:", err);
    res.status(500).json({ error: "Errore interno del server durante il login." });
  }
};

/**
 * Restituisce i dati dell'utente contenuti nel JWT.
 * Utilizzata per il ripristino della sessione al refresh del frontend.
 */
export const getMe = async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Sessione non valida." });
  }
};

/**
 * Recupera artisti o brani preferiti dell'utente.
 * Implementa una logica di cache su Firestore (validità 24h) per ottimizzare le performance.
 */
export const TopUser = async (req, res) => {
  const spotifyId = req.user?.spotifyId;
  const operation = req.query.type || "artists"; 
  const time_range = req.query.range || "medium_term";

  if (!spotifyId) return res.status(401).json({ error: "Non autorizzato." });

  try {
    const statsRef = db.collection("user_stats").doc(spotifyId);
    const doc = await statsRef.get();

    // Verifica validità Cache (24 ore)
    if (doc.exists) {
      const existingData = doc.data();
      const lastUpdated = existingData.lastUpdated?.toDate();
      const now = new Date();
      
      const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);
      if (hoursDiff < 24 && existingData[operation]?.[time_range]) {
        return res.json({ 
          data: existingData[operation][time_range].items, 
          total: existingData[operation][time_range].total,
          type: operation, 
          range: time_range,
          cached: true
        });
      }
    }

    // Cache assente o scaduta: Richiesta a Spotify API
    const accessToken = await getValidAccessToken(spotifyId);
    const spotifyUrl = `https://api.spotify.com/v1/me/top/${operation}?time_range=${time_range}&limit=50`;

    const response = await fetch(spotifyUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const spotifyData = await response.json();

    // Normalizzazione dati per il frontend
    const processedResults = spotifyData.items.map(item => {
      const baseInfo = {
        id: item.id,
        name: item.name,
        image: operation === "artists" 
          ? item.images?.[0]?.url 
          : item.album?.images?.[0]?.url,
        link: item.external_urls?.spotify
      };

      if (operation === "tracks") {
        return {
          ...baseInfo,
          artist: item.artists?.map(a => a.name).join(', ') || "Artista sconosciuto"
        };
      }
      return baseInfo;
    });

    const responseBody = { 
      data: processedResults, 
      total: spotifyData.total, 
      type: operation, 
      range: time_range, 
      cached: false 
    };

    // Aggiornamento Cache su Firestore (Usa merge:true per non sovrascrivere altre statistiche)
    await statsRef.set({
      spotifyId,
      lastUpdated: new Date(),
      [operation]: {
        ...doc.data()?.[operation],
        [time_range]: { 
            items: processedResults, 
            total: spotifyData.total 
        }
      }
    }, { merge: true });

    res.json(responseBody);

  } catch (err) {
    console.error("[CONTROLLER ERROR] Errore TopUser:", err);
    res.status(500).json({ error: "Errore durante il recupero dei dati da Spotify." });
  }
};