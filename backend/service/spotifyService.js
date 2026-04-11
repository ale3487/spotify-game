/**
 * @file spotifyService.js
 * @description Gestore dei token OAuth2 per Spotify. Implementa la logica di 
 * persistenza su Firestore e il rinnovo automatico (Refresh Flow) per garantire
 * sessioni utente ininterrotte.
 */

import fetch from "node-fetch";
import { db } from "../firebase.js";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

/**
 * Genera l'header di autorizzazione Basic richiesto da Spotify per lo scambio token.
 * Encoding in Base64 delle credenziali client.
 * @returns {string} Stringa Base64 nel formato client_id:client_secret
 */
const encodeBasicAuth = () =>
  Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

/**
 * Recupera un Access Token valido dal database Firestore.
 * Se il token è prossimo alla scadenza (finestra di 60s), avvia automaticamente
 * la procedura di refresh tramite le API di Spotify e aggiorna Firestore.
 * Implementa un buffer di sicurezza per prevenire errori dovuti a latenza di rete.
 * 
 * @param {string} spotifyId - L'ID univoco dell'utente Spotify (document ID in Firestore)
 * @returns {Promise<string>} L'access token pronto all'uso per le richieste API
 * @throws {Error} Se l'utente non esiste nel database o se il refresh fallisce
 * 
 * @example
 * const token = await getValidAccessToken('spotify_user_id');
 * // Token è pronto per le richieste API, refresh automatico se necessario
 */
export const getValidAccessToken = async (spotifyId) => {
  const userRef = db.collection("users").doc(spotifyId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error(`Utente [${spotifyId}] non trovato nel database.`);
  }

  let { accessToken, refreshToken, tokenExpiresAt } = userDoc.data();

  /**
   * LOGICA DI REFRESH
   * Utilizziamo un buffer di 60.000ms (1 minuto) per prevenire fallimenti nelle chiamate 
   * asincrone dovuti a latenza di rete proprio durante la scadenza.
   */
  if (Date.now() > (tokenExpiresAt - 60000)) {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    });

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${encodeBasicAuth()}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error_description || "Impossibile rinnovare il token.");
      }

      /**
       * Spotify potrebbe non restituire un nuovo refresh_token se quello attuale 
       * è ancora valido a lungo termine. In tal caso, preserviamo quello esistente.
       */
      accessToken = data.access_token;
      const newRefreshToken = data.refresh_token || refreshToken;
      tokenExpiresAt = Date.now() + (data.expires_in * 1000);

      // Sincronizzazione atomica con Firestore per persistere i nuovi token
      await userRef.update({
        accessToken,
        refreshToken: newRefreshToken,
        tokenExpiresAt,
        lastRefresh: new Date().toISOString() // Timestamp utile per debug e audit log
      });

    } catch (error) {
      console.error(`[AUTH ERROR] Refresh fallito per utente ${spotifyId}:`, error.message);
      throw error;
    }
  }

  return accessToken;
};