/**
 * @file Dashboard.tsx
 * @description Dashboard principale dell'applicazione, accessibile dopo il login. 
 * Permette agli utenti di creare o unirsi a stanze di gioco, visualizzare il proprio profilo Spotify e accedere alle statistiche (se online o con cache disponibile). 
 */

import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { checkCacheStatus } from './service/spotify.service'; 
import type { SpotifyUser } from './types/user.types';
import { useLobby } from './hooks/useLobby';
import { NeonBackground } from './components/NeonBackground';
import { MouseTracker } from './components/MouseTracker';
import { Logo } from './components/Logo';

const VITE_FRONTEND_VAPID_KEYS = import.meta.env.VITE_FRONTEND_VAPID_KEYS || "http://127.0.0.1:5000";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

// Funzione di utilità per convertire la VAPID Key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const Dashboard = ({ user }: { user: SpotifyUser | null }) => {
  const navigate = useNavigate();
  const { createRoom, joinRoom, room, error: lobbyError } = useLobby();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasCache, setHasCache] = useState(false);
  const [joinCode, setJoinCode] = useState("");

 const subscribeToNotifications = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Chiede il permesso all'utente per ricevere notifiche push
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VITE_FRONTEND_VAPID_KEYS)
      });

      // Invia al server Node
    await fetch(`${BACKEND_URL}/api/spotify/subscribe`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userId: user?.spotifyId 
        })
      });
      
      alert("Notifiche attivate! Ti avviseremo ogni 24h.");
    }
  } catch (err) {
    console.error("Errore:", err);
  }
  };

  useEffect(() => {
    if (room?.roomId) navigate(`/lobby/${room.roomId}`);
  }, [room, navigate]);

  useEffect(() => {
    checkCacheStatus().then(setHasCache);
    const handleStatusChange = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) checkCacheStatus().then(setHasCache);
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  if (!user) return <Navigate to="/" />;

  const canShowStats = isOnline || hasCache;

  return (
  <div className="min-h-screen bg-[#020203] text-white flex flex-col items-center justify-center relative overflow-hidden selection:bg-brand selection:text-black">
    <NeonBackground />
    <MouseTracker />

    {/* HEADER BAR */}
    <header className="absolute top-0 left-0 w-full p-8 z-20">
      <div className="max-w-7xl mx-auto flex justify-start">
        <Logo size="md" />
      </div>
    </header>

    <main className="max-w-md w-full px-6 relative z-10 animate-in fade-in zoom-in duration-700">
      <div className="bg-transparent p-6 text-center relative">
        
        {/* USER PROFILE SECTION */}
        <div className="mb-12 flex flex-col items-center animate-avatar-vibe">
          <div className="relative group">
            {/* Glow di sfondo dinamico */}
            <div className={`absolute -inset-6 rounded-full opacity-20 blur-3xl transition-all duration-700 ${isOnline ? 'bg-brand' : 'bg-transparent'}`}></div>
            
            {/* AVATAR CONTAINER */}
            <div className={`relative w-32 h-32 md:w-36 md:h-36 rounded-full border-[6px] p-1.5 transition-all duration-700 
              ${isOnline 
                ? 'border-brand shadow-[0_0_30px_rgba(199,154,0,0.3)]' 
                : 'border-white/10 bg-white/5'}`}>
              
              {user.images && user.images.length > 0 ? (
                <img 
                  src={user.images[0].url} 
                  alt="Profile" 
                  className={`w-full h-full rounded-full object-cover transition-all duration-700 ${isOnline ? 'grayscale-0' : 'grayscale opacity-50'}`} 
                />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center text-white/10 italic font-black">?</div>
              )}

              {/* STICKER STATUS */}
              <div className={`absolute -top-1 -left-4 text-black text-[10px] font-black px-3 py-1 rounded-lg uppercase shadow-2xl rotate-[-10deg] z-20 transition-all duration-500
                ${isOnline ? 'bg-brand shadow-brand/30' : 'bg-red-600 text-white shadow-red-600/30'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
          
          <h1 className="mt-8 text-2xl font-black tracking-tighter uppercase italic text-white/90">
            {user.display_name}
          </h1>
        </div>

        <div className="flex flex-col gap-6">
          
          {/* INPUT CODICE */}
          <div className="relative">
            <input 
              type="text"
              placeholder="CODICE STANZA"
              value={joinCode}
              maxLength={5}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl text-center font-black tracking-[0.6em] text-xl uppercase focus:outline-none focus:border-brand/50 focus:bg-white/[0.07] transition-all placeholder:text-white/10 placeholder:tracking-normal placeholder:text-[10px]"
            />
          </div>

          {/* GRID AZIONI PRINCIPALI */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              disabled={!isOnline}
              onClick={() => createRoom(user)}
              className={`group relative overflow-hidden font-black py-5 rounded-2xl transition-all active:scale-95 uppercase text-[9px] tracking-[0.2em]
                ${isOnline 
                  ? 'bg-brand text-black shadow-[0_0_25px_rgba(255,174,0,0.15)] hover:shadow-[0_0_35px_rgba(255,174,0,0.25)]' 
                  : 'bg-white/5 text-white/10 border border-white/5'}`}
            >
              <span className="relative z-10">Crea Stanza</span>
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-none"></div>
            </button>

            <button 
              disabled={!isOnline || joinCode.length !== 5}
              onClick={() => joinRoom(joinCode.toUpperCase(), user)}
              className={`group flex items-center justify-center gap-2 font-black py-5 rounded-2xl transition-all active:scale-95 uppercase text-[9px] tracking-[0.2em] border
                ${isOnline && joinCode.length === 5 
                  ? 'border-brand/50 bg-brand/10 text-brand shadow-[0_0_20px_rgba(255,174,0,0.1)] hover:bg-brand hover:text-black' 
                  : 'border-white/5 text-white/10'}`}
            >
              <span>Unisciti alla Stanza</span>
            </button>
          </div>

          {/* STATISTICHE CENTRATO SOTTO */}
          <button 
            disabled={!canShowStats}
            onClick={() => navigate("/statistics")}
            className={`group flex items-center justify-center gap-3 w-full font-black py-4 rounded-2xl transition-all uppercase text-[10px] tracking-[0.2em] border
              ${canShowStats 
                ? 'border-white/10 text-white/40 hover:text-brand hover:border-brand/50 hover:bg-brand/5' 
                : 'border-white/5 text-white/10'}`}
          >
            <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <span>Analisi Statistiche</span>
          </button>

          {/* BOTTONE NOTIFICHE */}
            <button 
              onClick={subscribeToNotifications}
              className="group flex items-center justify-center gap-3 w-full font-black py-4 rounded-2xl transition-all uppercase text-[10px] tracking-[0.2em] border border-brand/20 bg-brand/5 text-brand/60 hover:text-brand hover:border-brand/50 hover:bg-brand/10 mt-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-brand blur-md opacity-0 group-hover:opacity-40 transition-opacity rounded-full"></div>
                <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span>Attiva Update Quotidiani</span>
            </button>

          {lobbyError && (
            <p className="mt-2 text-brand text-[9px] font-black uppercase tracking-widest animate-pulse text-center">
              {lobbyError}
            </p>
          )}
        </div>
      </div>
    </main>
  </div>
  );
};

export default Dashboard;