import fetch from "node-fetch";
import { db, admin } from "../firebase.js";
import jwt from "jsonwebtoken";
import { getValidAccessToken } from "../service/spotifyService.js";

export const loginSpotify = async (req, res) => {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
  
  // USA SEMPRE IL FILE .ENV - Se manca, il server deve dare errore in sviluppo
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error("ERRORE: JWT_SECRET non definito nel file .env!");
  }

  const encodeBasicAuth = () =>
    Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const { code, code_verifier } = req.body;
  if (!code || !code_verifier)
    return res.status(400).json({ error: "Missing code or verifier" });

  try {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
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

    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = await profileRes.json();

    await db.collection("users").doc(profile.id).set({
      spotifyId: profile.id,
      username: profile.display_name,
      email: profile.email,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: Date.now() + expires_in * 1000,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // --- LOGICA COOKIES E JWT ---
    const userData = {
      spotifyId: profile.id,
      display_name: profile.display_name,
      email: profile.email,
    };

    const sessionToken = jwt.sign(userData, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("session_token", sessionToken, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      sameSite: "Lax", 
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    res.json(userData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Funzione per ottenere i dati dell'utente loggato, usando il cookie JWT per autenticazione
export const getMe = async (req, res) => {
  // Se arrivi qui, il middleware 'authenticate' ha già verificato il cookie
  // e ha salvato i dati in req.user
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "User not found" });
  }
};


// Backend: controllers/spotify.controller.js

export const TopUser = async (req, res) => {
  const spotifyId = req.user?.spotifyId; 
  
  // Leggiamo i parametri dalla URL (es: ?type=artists&range=long_term)
  // Impostiamo dei valori di default se mancano
  const operation = req.query.type || "artists"; // "artists" o "tracks"
  const time_range = req.query.range || "medium_term"; // "short_term", "medium_term", "long_term"

  if (!spotifyId) {
    return res.status(401).json({ error: "Utente non autenticato" });
  }

  try {
    const accessToken = await getValidAccessToken(spotifyId);

    // Costruiamo la URL dinamica per Spotify
    // Endpoint ufficiale: https://api.spotify.com/v1/me/top/${operation}
    const spotifyUrl = `https://api.spotify.com/v1/me/top/${operation}?time_range=${time_range}&limit=25`;

    const response = await fetch(spotifyUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();

    // Estraiamo i nomi (funziona sia per artisti che per tracce)
    const results = data.items.map(item => item.name);

    res.json({ data: results, type: operation, range: time_range });

  } catch (err) {
    console.error("Errore in TopUser:", err);
    res.status(500).json({ error: "Server error" });
  }
};