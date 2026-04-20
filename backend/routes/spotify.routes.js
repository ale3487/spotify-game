/**
 * @file spotify.routes.js
 * @description Definizione delle rotte API per l'integrazione con Spotify.
 * Gestisce il routing tra gli endpoint pubblici (auth) e quelli protetti (dati utente)
 * applicando i middleware di sicurezza necessari.
 */

import express from "express";
import { loginSpotify, getMe, TopUser, spotifyLyrics, getToken, subscribe} from "../controllers/spotify.controller.js";
import { authenticate } from "../service/coockies.js";

const router = express.Router();

/**
 * @route   POST /api/spotify/login
 * @desc    Endpoint pubblico per l'autenticazione iniziale (PKCE Exchange).
 *          Riceve il 'code' e 'code_verifier' dal client e scambia con i token di accesso.
 *          Persiste i token su Firestore e genera una sessione JWT.
 * @access  Public
 * @param   {string} req.body.code - Codice di autorizzazione da Spotify
 * @param   {string} req.body.code_verifier - Verifier PKCE per validare la richiesta
 * @returns {Object} Dati dell'utente e imposta cookie session_token (HttpOnly)
 */
router.post("/login", loginSpotify);

/**
 * @route   GET /api/spotify/me
 * @desc    Recupera il profilo dell'utente corrente dalla sessione JWT.
 *          Risale ai dati memorizzati nel token JWT contenuto nel cookie.
 * @access  Private (Richiede session_token HttpOnly valido)
 * @returns {Object} Profilo dell'utente (spotifyId, display_name, email, images)
 */
router.get("/me", authenticate, getMe);

/**
 * @route   GET /api/spotify/TopUser
 * @desc    Recupera artisti o brani preferiti dell'utente.
 *          Implementa cache su Firestore (validità 24h).
 *          La funzione controller gestirà internamente il refresh del token Spotify se necessario.
 * @access  Private
 * @query   {string} type - "artists" o "tracks" (default: "artists")
 * @query   {string} range - "short_term", "medium_term" o "long_term" (default: "medium_term")
 * @returns {Object} Array di artisti/tracce con metadati (data, total, type, range, cached)
 */
router.get('/TopUser', authenticate, TopUser);

/**
 * @route   GET /api/spotify/lyrics
 * @desc    Recupera i testi sincronizzati della top 5 canzoni dell'utente (long_term).
 *          Identifica il ritornello e il timestamp d'inizio tramite utility functions.
 *          Utilizza lrclib.net per i testi sincronizzati.
 * @access  Private
 * @returns {Object} Array di track con lyrics, chorus, e timestamp
 */
router.get('/lyrics', authenticate, spotifyLyrics);

/**
 * @route   GET /api/spotify/access_token
 * @desc    Endpoint per ottenere l'access token dal database Spotify per l'utente autenticato.
 *          Il token viene recuperato da Firestore e potrebbe essere rinnovato automaticamente
 *          se prossimo alla scadenza (tramite getValidAccessToken dal service).
 *          Utilizzato dal frontend per il Spotify Web Playback SDK.
 * @access  Private
 * @returns {Object} Oggetto con accessToken pronto per le richieste API Spotify
 */
router.get('/access_token', authenticate, getToken)

/**
 * @route   GET /api/spotify/subscribe
 * @desc    Endpoint per iscrivere l'utente a notifiche o aggiornamenti Spotify.
 * @access  Private
 * @returns {Object} Messaggio di conferma della sottoscrizione
 */

router.post('/subscribe', authenticate, subscribe);

export default router;