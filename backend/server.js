/**
 * @file server.js
 * @description Entry point del server Express per l'applicazione BeatMatch.
 * Configura il middleware di sicurezza, la gestione delle sessioni tramite cookie
 * e inizializza le rotte API per l'integrazione con Spotify.
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';

import spotifyRoutes from "./routes/spotify.routes.js";

// Caricamento variabili d'ambiente (.env)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * CONFIGURAZIONE MIDDLEWARE
 */

// Parsing dei cookie: Necessario per gestire le sessioni HttpOnly inviate dal client
app.use(cookieParser()); 

/**
 * Configurazione CORS (Cross-Origin Resource Sharing)
 * - origin: Specifica l'URI esatto del frontend per prevenire accessi non autorizzati.
 * - credentials: true: Indispensabile per permettere il passaggio dei cookie di sessione.
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5173', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsing del corpo delle richieste in formato JSON
app.use(express.json());

/**
 * DEFINIZIONE DELLE ROTTE
 * Tutte le chiamate relative a Spotify sono raggruppate sotto il prefisso /api/spotify
 */
app.use("/api/spotify", spotifyRoutes);

// Avvio del server
app.listen(PORT, () => {
  console.log(`[SERVER] BeatMatch Backend in esecuzione sulla porta ${PORT}`);
});

