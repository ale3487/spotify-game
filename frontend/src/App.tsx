/**
 * @file App.tsx
 * @description Componente root dell'applicazione BeatMatch con SpotifyProvider Globale.
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
import Game from './Game';
import  SpotifyPlayer  from './components/SpotifyPlayer'; 
import { SpotifyProvider } from './context/SpotifyContext';

/**
 * Registra e aggiorna il Service Worker per il supporto PWA
 */
registerSW({ immediate: true });

/**
 * Componente per la gestione della Callback di OAuth2.
 */
function Callback({ onLogin }: { onLogin: (u: SpotifyUser) => void }) {
  const navigate = useNavigate();
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

export default function App() {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
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
    /* Avvolgiamo tutte le rotte con lo SpotifyProvider.
       Il Player verrà creato una sola volta non appena 'user' sarà disponibile.
    */
    <SpotifyProvider user={user}>
      <SpotifyPlayer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<Callback onLogin={setUser} />} />
        
        {/* Pagine principali */}
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/lobby/:roomId" element={<LobbyPage user={user} />} />
        <Route path="/game/:roomId" element={<Game user={user} />} />
        
        {/* Statistiche */}
        <Route path="/statistics" element={<Statistics user={user} isOffline={!isOnline} />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
      </Routes>
    </SpotifyProvider>
  );
}