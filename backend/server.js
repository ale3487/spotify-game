import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { db, admin } from "./firebase.js";
import { getValidAccessToken } from "./spotifyService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// Helper: base64 encode client_id:client_secret
const encodeBasicAuth = () => Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

// --- Login endpoint ---
app.post("/api/spotify/login", async (req, res) => {
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

    // Recupero dati utente
    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = await profileRes.json();
    if (profile.error) return res.status(400).json(profile);

    //  Salvataggio su Firestore
    await db.collection("users").doc(profile.id).set({
      spotifyId: profile.id,
      username: profile.display_name,
      email: profile.email,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: Date.now() + expires_in * 1000,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
        console.log("Profile:", profile);

    // NON mandiamo i token al frontend
    res.json({
      message: "Login successful",
      user: {
        id: profile.id,
        username: profile.display_name,
        email: profile.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Refresh token endpoint ---
app.post("/api/spotify/refresh", async (req, res) => {
  const { spotifyId } = req.body;
  if (!spotifyId)
    return res.status(400).json({ error: "Missing spotifyId" });

  try {
    const userDoc = await db.collection("users").doc(spotifyId).get();
    if (!userDoc.exists)
      return res.status(404).json({ error: "User not found" });

    const { refreshToken } = userDoc.data();

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodeBasicAuth()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (data.error) return res.status(400).json(data);

    // aggiorna solo access token
    await db.collection("users").doc(spotifyId).update({
      accessToken: data.access_token,
      tokenExpiresAt: Date.now() + data.expires_in * 1000,
    });

    res.json({ message: "Token refreshed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Endpoint profilo Spotify ---
app.post("/api/spotify/profile", async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: "Missing access token" });

  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const data = await response.json();
    if (data.error) return res.status(400).json(data);

    // manda solo display_name e email
    res.json({
      display_name: data.display_name,
      email: data.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


