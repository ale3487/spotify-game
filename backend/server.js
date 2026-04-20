/**
 * @file server.js
 * @description File principale del server di BeatMatch.
 * Configura la istanza Express, abilita CORS, imposta i middleware (cookie parser, JSON).
 * Inizializza HTTP + Socket.io per la comunicazione real-time tra giocatori nelle stanze.
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import { createServer } from "http"; 
import { Server } from "socket.io"; 
import webpush from 'web-push';
import cron from 'node-cron';
import admin from 'firebase-admin';

import spotifyRoutes from "./routes/spotify.routes.js";
import { initSocketLogic } from "./socket.js"; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configurazione Middleware
app.use(cookieParser()); 
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5173', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use("/api/spotify", spotifyRoutes);

/**
 * CONNESSIONE HTTP + SOCKET.IO
 */
// 4. Crea il server HTTP usando l'app Express
const httpServer = createServer(app);

// 5. Inizializza Socket.io sul server HTTP
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5173',
    credentials: true
  }
});

// 6. Passa l'istanza 'io' al file socket.js
initSocketLogic(io);

// 7. IMPORTANTE: Avvia 'httpServer' 
httpServer.listen(PORT, () => {
  console.log(`[SERVER] BeatMatch Backend + Sockets in esecuzione sulla porta ${PORT}`);
});

// Configura VAPID per le notifiche push
webpush.setVapidDetails('mailto:a.cerasomma@studenti.unipi.it', process.env.FRONTEND_VAPID_PUBLIC_KEY, process.env.BACKEND_VAPID_KEYS);

// Esegue ogni giorno alle 12:00 per inviare notifiche push agli utenti con sottoscrizione attiva
cron.schedule('00 12 * * *', async () => {
  const usersSnapshot = await admin.firestore().collection('users')
    .where('pushSubscription', '!=', null).get();

  const payload = JSON.stringify({
    title: 'BeatMatch Stats',
    body: 'Guarda le tue statistiche aggiornate!'
  });

  usersSnapshot.forEach(doc => {
    const sub = doc.data().pushSubscription;
    webpush.sendNotification(sub, payload).catch(err => {
      if (err.statusCode === 410) {
        // in caso di sottoscrizione non più valida, rimuovila dal database
        doc.ref.update({ pushSubscription: null });
      }
    });
  });
});
