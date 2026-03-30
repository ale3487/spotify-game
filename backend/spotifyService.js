import fetch from "node-fetch";
import { db } from "./firebase.js";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

const encodeBasicAuth = () =>
  Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

export const getValidAccessToken = async (spotifyId) => {
  const userDoc = await db.collection("users").doc(spotifyId).get();

  if (!userDoc.exists) throw new Error("User not found");

  let { accessToken, refreshToken, tokenExpiresAt } = userDoc.data();

  // Se token scaduto → refresh automatico
  if (Date.now() > tokenExpiresAt) {
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

    accessToken = data.access_token;
    tokenExpiresAt = Date.now() + data.expires_in * 1000;

    await db.collection("users").doc(spotifyId).update({
      accessToken,
      tokenExpiresAt,
    });
  }

  return accessToken;
};