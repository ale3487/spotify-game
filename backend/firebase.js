/**
 * @file firebase.js
 * @description Configurazione e inizializzazione dell'SDK Firebase Admin.
 * Gestisce la connessione al database Firestore per la persistenza dei dati utente,
 * la gestione della cache delle API Spotify e lo stato delle sessioni di gioco.
 */

import admin from "firebase-admin";
/** * Importazione del Service Account. 
 */
import serviceAccount from "./gioco-spotify-firebase-adminsdk-fbsvc-75ef64ab90.json" with { type: "json" };

/**
 * Inizializzazione dell'app Firebase con credenziali amministrative.
 * Fornisce accesso completo (lettura/scrittura) alle risorse del progetto Firestore.
 */
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/**
 * Istanza del database Firestore.
 * Utilizzata per le operazioni CRUD (Create, Read, Update, Delete) nel backend.
 */
const db = admin.firestore();

export { db, admin };