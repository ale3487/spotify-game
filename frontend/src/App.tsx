/**
 * @file App.tsx
 * @description Componente root dell'applicazione BeatMatch.
 * Gestisce l'autenticazione OAuth2, la persistenza della sessione e il routing principale.
 */

import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { exchangeToken, checkSession } from "./service/spotify.service";
import Home from './home';
import Statistics from './Statistics';
import Dashboard from './Dashboard';
import { registerSW } from 'virtual:pwa-register';
import type { SpotifyUser } from './types/user.types';
import LobbyPage from './LobbyPage';

/**
 * Registra e aggiorna il Service Worker per il supporto PWA
 */
registerSW({ immediate: true });

/**
 * Componente per la gestione della Callback di OAuth2.
 * Recupera il codice dall'URL, effettua lo scambio dei token e reindirizza l'utente.
 * 
 * @param {Object} props - Proprietà del componente
 * @param {Function} props.onLogin - Callback per aggiornare lo stato dell'utente nel componente root
 * @returns {JSX.Element} Schermata di caricamento durante la sincronizzazione
 */
function Callback({ onLogin }: { onLogin: (u: SpotifyUser) => void }) {
  const navigate = useNavigate();
  
  /**
   * Ref per prevenire doppie chiamate causate dal React.StrictMode in sviluppo
   * @type {React.MutableRefObject<boolean>}
   */
  const hasCalled = useRef(false);

  useEffect(() => {
    async function handle() {
      if (hasCalled.current) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (!code) return;

      hasCalled.current = true;
      try {
        const data = await exchangeToken();
        if (data && data.spotifyId) {
          onLogin(data as SpotifyUser);
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Login fallito", err);
        navigate("/");
      }
    }
    handle();
  }, [navigate, onLogin]);

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="animate-pulse text-brand font-black tracking-widest uppercase">
          Sincronizzazione Spotify...
        </div>
    </div>
  );
}

/**
 * Componente Root dell'applicazione BeatMatch.
 * Gestisce:
 * - L'inizializzazione della sessione utente al caricamento
 * - La persistenza dello stato di login
 * - Lo stato online/offline
 * - Il routing principale tra le pagine
 * 
 * @returns {JSX.Element} Albero di routing dell'applicazione
 */
export default function App() {
  /**
   * Dati dell'utente autenticato
   * @type {[SpotifyUser | null, Function]}
   */
  const [user, setUser] = useState<SpotifyUser | null>(null);

  /**
   * Indica se l'app sta caricando i dati della sessione
   * @type {[boolean, Function]}
   */
  const [loading, setLoading] = useState<boolean>(true);
  
  /**
   * Stato della connessione internet (online/offline)
   * @type {[boolean, Function]}
   */
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    /**
     * Inizializza la sessione al caricamento dell'app
     * Controlla se esiste una sessione valida nel backend
     */
    async function initAuth() {
      try {
        const userData = await checkSession();
        if (userData && userData.spotifyId) {
          setUser(userData as SpotifyUser);
        }
      } catch (err) {
        console.error("Sessione non valida o scaduta", err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();

    /**
     * Listener per il cambio di connettività
     */
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/callback" element={<Callback onLogin={setUser} />} />
      
      {/* 2. Dashboard: accessibile sempre (gestisce internamente lo stato offline) */}
      <Route path="/dashboard" element={<Dashboard user={user} />} />
      
      {/* 3. Lobby: accessibile solo se l'utente è autenticato, altrimenti reindirizza alla Home */}
      <Route path="/lobby/:roomId" element={<LobbyPage user={user} />} />

      {/* 4. Rotte Condizionali: se offline, reindirizza alla Dashboard */}
      <Route path="/statistics" element={<Statistics user={user} isOffline={!isOnline} />} />

      {/* Fallback per rotte non trovate o errori di caricamento offline */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
}