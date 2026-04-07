import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import { createServer } from "http"; 
import { Server } from "socket.io"; 

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
