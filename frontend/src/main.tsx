/**
 * @file Entry point principale dell'applicazione React.
 * Inizializza il root del DOM, configura il routing globale e applica i wrapper di sistema.
 * @version 1.1.0
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css';
import { LobbyProvider } from './context/LobbyProvider';

/**
 * Inizializzazione della Root dell'applicazione.
 * * La gerarchia dei componenti segue questo ordine logico:
 * 1. StrictMode: Per il debugging e la validazione dei componenti.
 * 2. BrowserRouter: Fornisce le funzionalità di navigazione.
 * 3. LobbyProvider: Gestisce lo stato globale della partita e la Socket. 
 * Stando qui sopra App, permette a qualsiasi rotta di accedere ai dati della stanza.
 * 4. App: Il cuore dell'interfaccia utente.
 */
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <LobbyProvider>
          <App />
        </LobbyProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  // Gestione errore critico nel caso il DOM non sia pronto o l'ID sia errato
  console.error("Errore fatale: Impossibile trovare l'elemento 'root' nel documento.");
}
