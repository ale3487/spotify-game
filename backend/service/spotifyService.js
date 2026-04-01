import fetch from "node-fetch";
import { db } from "../firebase.js";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

const encodeBasicAuth = () =>
  Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

// Funzione per ottenere un access token valido, con refresh automatico se necessario
export const getValidAccessToken = async (spotifyId) => {
  const userDoc = await db.collection("users").doc(spotifyId).get();

  if (!userDoc.exists) throw new Error("User not found");

  let { accessToken, refreshToken, tokenExpiresAt } = userDoc.data();

  // Se token scaduto -> refresh automatico
  if (Date.now() > tokenExpiresAt - 60000) {
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
    if (data.error) throw new Error("Refresh failed");
    // Spotify potrebbe non restituire un nuovo refresh token, quindi mantieni quello vecchio se non presente
    const newRefreshToken = data.refresh_token || refreshToken;
    accessToken = data.access_token;
    tokenExpiresAt = Date.now() + data.expires_in * 1000;
    // aggiorna Firestore con i nuovi token
    await db.collection("users").doc(spotifyId).update({
      accessToken,
      refreshToken: newRefreshToken,
      tokenExpiresAt,
    });
  }

  return accessToken;
};