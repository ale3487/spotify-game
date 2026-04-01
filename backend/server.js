import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';

import spotifyRoutes from "./routes/spotify.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
// Middleware per il parsing dei cookie e del JSON, sicurezza e robustezza
app.use(cookieParser()); // Permette al server di leggere i cookie

app.use(cors({
  origin: 'http://127.0.0.1:5173', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Monta le route
app.use("/api/spotify", spotifyRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

