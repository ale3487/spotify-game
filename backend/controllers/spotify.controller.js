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
import { Lyrics } from "../class/Lyrics.js";
import { findChorusByBlocks } from "../utility/findChorusByBlocks.js";
import { findChorusTimestamp } from "../utility/findChorusTimestamp.js";

/**
 * Gestisce il callback di autenticazione Spotify (OAuth2 PKCE Exchange).
 * Scambia il 'code' e 'code_verifier' con i token di accesso/refresh.
 * Salva l'utente su Firestore e imposta il cookie di sessione JWT HttpOnly.
 * 
 * @async
 * @param {import('express').Request} req - Richiesta con body: { code, code_verifier }
 * @param {import('express').Response} res - Risposta con dati utente e cookie session_token
 * @returns {void}
 * @description
 * Step 1: Scambia code con token Spotify (access_token, refresh_token)
 * Step 2: Recupera profilo utente dall'API Spotify (/v1/me)
 * Step 3: Salva profilo e token su Firestore
 * Step 4: Genera JWT e lo imposta come cookie HttpOnly secure
 * Step 5: Restituisce dati utente al client
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
 * Restituisce i dati dell'utente estratti dal JWT della sessione.
 * Consente al frontend di ripristinare la sessione al caricamento della pagina.
 * 
 * @async
 * @param {import('express').Request} req - Richiesta con req.user caricato dal middleware authenticate
 * @param {import('express').Response} res - Risposta con dati utente in JSON
 * @returns {void} JSON { spotifyId, display_name, email, images }
 * @description
 * Il middleware authenticate valida il JWT e carica req.user con i dati decodificati.
 * Questa funzione semplicemente restituisce quei dati al client.
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

/**
 * Recupera i testi sincronizzati per le tracce "long term" dell'utente
 */
export const spotifyLyrics = async (req, res) => {
  try {
    const lyricsInstances = [];
    const spotifyId = req.user?.spotifyId;
    let counter = 0;

    // 1. Controllo Autenticazione
    if (!spotifyId) {
      return res.status(401).json({ error: "Non autorizzato. Sessione mancante." });
    }

    // 2. Recupero dati da Firestore
    const dbUserData = await db.collection("user_stats").doc(spotifyId).get();
    if (!dbUserData.exists) {
      return res.status(404).json({ error: "Dati utente non trovati nel database." });
    }

    const userData = dbUserData.data();
    // Navigazione sicura nella struttura specifica: tracks -> long_term -> items
    const trackList = userData.tracks?.long_term?.items || [];

    // 3. Elaborazione Tracce (Limite a 5 per ottimizzare i tempi di risposta)
    for (const track of trackList) {
      if (track?.name && track?.artist) {
        if (counter >= 5) break;
        counter++;

        const currentTrack = new Lyrics(track.name, track.artist);

        // Preparazione dei parametri codificati per l'URL (gestione spazi e caratteri speciali)
        const artistEnc = encodeURIComponent(track.artist);
        const trackEnc = encodeURIComponent(track.name);
        const lyricsUrl = `https://lrclib.net/api/get?artist_name=${artistEnc}&track_name=${trackEnc}`;

        try {
          const apiResponse = await fetch(lyricsUrl, {
            headers: { 'User-Agent': 'SpotifyGameApp/1.0' },
          });

          if (apiResponse.ok) {
            const data = await apiResponse.json();
            currentTrack.lyrics = data.plainLyrics ||data.syncedLyrics  || "Testo non trovato";
            currentTrack.syncedLyrics = data.syncedLyrics || null;
          } else {
            currentTrack.lyrics = "Testo non disponibile";
          }
        } catch (apiError) {
          // Se LRCLIB fallisce, assegnazione di un messaggio di errore senza bloccare il ciclo
          currentTrack.lyrics = "Errore nel recupero del testo";
        }
        currentTrack.chorus = findChorusByBlocks(currentTrack.lyrics);
        currentTrack.syncedLines = findChorusTimestamp(currentTrack.syncedLyrics, currentTrack.chorus);
        console.log(`Elaborata traccia: ${currentTrack.name} di ${currentTrack.artist}` + ` - Chorus identificato: ${currentTrack.chorus ? "Sì" : "No"}`);
        console.log(`tempo ritornello: ${currentTrack.syncedLines || "Non trovato"}`);
        lyricsInstances.push(currentTrack);
      }
    }

    // 4. Trasformazione per il Frontend
    const responsePayload = lyricsInstances.map(item => ({
      track: item.name,
      artist: item.artist,
      lyrics: item.lyrics,
      chorus: item.chorus,
      timestamp: item.syncedLines
    }));

    // 5. Risposta finale
    return res.status(200).json({
      success: true,
      lyrics: responsePayload
    });

  } catch (error) {
    // Gestione errori del server
    console.error("Errore critico in spotifyLyrics:", error);
    return res.status(500).json({ error: "Errore interno del server durante l'elaborazione." });
  }
};

/**
 * Endpoint per ottenere l'access token dal database Spotify per l'utente autenticato, utilizzato per spotify web player.
 * 
 */

export const getToken = async (req, res) => {
  const spotifyId = req.user?.spotifyId;
  
  // 1. Verifica se l'utente è loggato nella sessione del backend
  if (!spotifyId) {
    console.error("[GET_TOKEN] Sessione mancante o spotifyId assente in req.user");
    return res.status(401).json({ error: "Sessione non valida o utente non loggato." });
  }

  try {
    // 2. Accesso a Firestore
    const userDoc = await db.collection("users").doc(spotifyId).get();

    if (!userDoc.exists) {
      console.error(`[GET_TOKEN] Documento non trovato per ID: ${spotifyId}`);
      return res.status(404).json({ error: "Dati utente non trovati nel database." });
    }

    const tokenData = userDoc.data();
    
    // 3. Verifica se il campo specifico esiste nel database

    const token = tokenData.accessToken;

    if (!token) {
      return res.status(404).json({ error: "Token non presente nel profilo utente." });
    }
    
    // Restituiamo 'accessToken' al frontend
    return res.status(200).json({ accessToken: token });

  } catch (err) {
    console.error("[CONTROLLER ERROR] Errore critico getToken:", err);
    return res.status(500).json({ error: "Errore interno del server." });
  }
};