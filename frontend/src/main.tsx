/**
 * @file Entry point principale dell'applicazione React.
 * Inizializza il root del DOM, configura il routing globale e applica i wrapper di sistema.
 * @version 1.0.0
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css';

/**
 * Inizializzazione della Root dell'applicazione.
 * * Viene utilizzato `document.getElementById('root')!` con l'operatore di non-null assertion 
 * di TypeScript per garantire che l'elemento radice esista nel file index.html.
 * * Il rendering include:
 * - {@link React.StrictMode}: Attiva controlli e avvisi aggiuntivi per lo sviluppo.
 * - {@link BrowserRouter}: Fornisce il contesto per la gestione della cronologia e delle rotte (v6).
 * - {@link App}: Il componente principale che contiene la logica e i layout dell'interfaccia.
 */
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  // Gestione errore critico nel caso il DOM non sia pronto o l'ID sia errato
  console.error("Errore fatale: Impossibile trovare l'elemento 'root' nel documento.");
}
