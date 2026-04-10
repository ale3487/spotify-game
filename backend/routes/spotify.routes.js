/**
 * @file spotify.routes.js
 * @description Definizione delle rotte API per l'integrazione con Spotify.
 * Gestisce il routing tra gli endpoint pubblici (auth) e quelli protetti (dati utente)
 * applicando i middleware di sicurezza necessari.
 */

import express from "express";
import { loginSpotify, getMe, TopUser, spotifyLyrics, getToken} from "../controllers/spotify.controller.js";
import { authenticate } from "../service/coockies.js";

const router = express.Router();

/**
 * @route   POST /api/spotify/login
 * @desc    Endpoint pubblico per l'autenticazione iniziale (PKCE Exchange).
 * @access  Public
 */
router.post("/login", loginSpotify);

/**
 * @route   GET /api/spotify/me
 * @desc    Recupera il profilo dell'utente corrente dalla sessione JWT.
 * @access  Private (Richiede session_token HttpOnly)
 */
router.get("/me", authenticate, getMe);

/**
 * @route   GET /api/spotify/TopUser
 * @desc    Recupera artisti o brani preferiti dell'utente.
 * La funzione controller gestirà internamente il refresh del token Spotify.
 * @access  Private
 */
router.get('/TopUser', authenticate, TopUser);

/**
 * @route   GET /api/spotify/lyrics
 * @desc    Recupera i testi della top 5 canzoni dell'utente.
 * @access  Private
 */
router.get('/lyrics', authenticate, spotifyLyrics);

/**
 * @route   GET /api/spotify/access_token
 * @desc   Endpoint per ottenere l'access token dal database Spotify per l'utente autenticato. 
 * @access  Private
 */

router.get('/access_token', authenticate, getToken)

export default router;