import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { exchangeToken, checkSession } from "./spotify.service";
import Home from './home';
import Statistics from './Statistics';
import Dashboard from './Dashboard';
import { registerSW } from 'virtual:pwa-register';
import type { SpotifyUser } from './types/user.types';
import LobbyPage from './LobbyPage';

registerSW({ immediate: true });



/**
 * Componente per la gestione della Callback di OAuth2.
 * Recupera il codice dall'URL, effettua lo scambio dei token e reindirizza l'utente.
 * * @param props - Proprietà del componente.
 * @param props.onLogin - Callback per aggiornare lo stato dell'utente nel componente root.
 */
function Callback({ onLogin }: { onLogin: (u: SpotifyUser) => void }) {
  const navigate = useNavigate();
  /** Ref per prevenire doppie chiamate causate dal React.StrictMode in sviluppo */
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
 * Componente Root dell'applicazione.
 * Gestisce la persistenza della sessione al caricamento e definisce l'alberatura delle rotte.
 */
export default function App() {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // 1. Monitoraggio connessione globale
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Inizializzazione sessione
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