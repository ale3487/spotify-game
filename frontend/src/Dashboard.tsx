/**
 * @file Dashboard.tsx
 * @description Hub principale dell'utente. 
 * Integra lo sfondo a note musicali, l'effetto torcia e la gestione della cache offline.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { checkCacheStatus } from './spotify.service'; 
import type { SpotifyUser } from './App';

// --- IMPORT COMPONENTI CORE ---
import { NeonBackground } from './components/NeonBackground';
import { MouseTracker } from './components/MouseTracker';
import { Logo } from './components/Logo';

const Dashboard = ({ user }: { user: SpotifyUser | null }) => {
  const navigate = useNavigate();
  
  // Stati per la gestione della connettività
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasCache, setHasCache] = useState(false);

  useEffect(() => {
    // Controllo disponibilità dati in cache per modalità offline
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

  // Protezione rotta: se l'utente non è loggato, torna alla landing
  if (!user) return <Navigate to="/" />;

  /**
   * Determina l'avatar di fallback basandosi sullo Spotify ID se l'immagine manca.
   */
  const getAvatarId = () => {
    if (user.defaultAvatarId) return user.defaultAvatarId;
    const charCodeSum = user.spotifyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (charCodeSum % 5) + 1;
  };

  const avatarId = getAvatarId();
  const avatarStyles: Record<number, string> = {
    1: 'text-brand bg-brand/10 border-brand/20',
    2: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    3: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    4: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    5: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  };

  const canShowStats = isOnline || hasCache;

  return (
    <div className="min-h-screen bg-[#020203] text-white flex flex-col items-center justify-center relative overflow-hidden selection:bg-brand selection:text-black">
      
      {/* SFONDO DINAMICO E TRACKER MOUSE */}
      <NeonBackground />
      <MouseTracker />

      <main className="max-w-md w-full px-6 relative z-10">
        
        {/* HEADER LOGO*/}
        <div className="flex justify-center mb-8">
           <Logo size="md" />
        </div>

        {/* DASHBOARD CARD (GLASSMORPHISM) */}
        <div className="bg-glass-gradient backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 text-center shadow-2xl relative transition-all duration-500 hover:border-white/20">
          
          {/* BADGE OFFLINE (Sincero: appare solo se non c'è rete) */}
          {!isOnline && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              Offline Mode
            </div>
          )}

          {/* AVATAR SECTION (Statica, senza effetti hover) */}
          <div className="mb-10 flex justify-center">
            {user.images && user.images.length > 0 ? (
              <img 
                src={user.images[0].url} 
                alt="Profile" 
                className={`w-36 h-36 rounded-full border-4 object-cover shadow-2xl transition-all duration-500 ${isOnline ? 'border-brand/40' : 'border-white/10 grayscale opacity-70'}`} 
              />
            ) : (
              <div className={`w-36 h-36 rounded-full border-4 flex items-center justify-center shadow-lg transition-all duration-500 ${avatarStyles[avatarId]} ${!isOnline && 'grayscale opacity-70 border-white/10'}`}>
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </div>

          {/* INFO UTENTE */}
          <div className="space-y-2 mb-10">
            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white leading-none">
              {user.display_name}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand/60 italic">
              User Dashboard
            </p>
          </div>

          {/* PULSANTI DI AZIONE */}
          <div className="flex flex-col gap-5">
            
            {/* MULTIPLAYER (Solo Online) */}
            <button 
              disabled={!isOnline}
              onClick={() => navigate("/lobby")}
              className={`group relative overflow-hidden w-full font-black py-5 rounded-[1.5rem] transition-all transform uppercase text-[10px] tracking-[0.2em] shadow-xl
                ${isOnline 
                  ? 'bg-emerald-500 text-brand-dark hover:scale-[1.03] active:scale-95' 
                  : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'
                }`}
            >
              <span className="relative z-10">
                {isOnline ? "Inizia Quiz Prova" : "Multiplayer Locked"}
              </span>
              {isOnline && (
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              )}
            </button>

            {/* STATISTICHE (Online o Cache presente) */}
            <button 
              disabled={!canShowStats}
              onClick={() => navigate("/statistics")}
              className={`group relative overflow-hidden w-full font-black py-5 rounded-[1.5rem] transition-all transform uppercase text-[10px] tracking-[0.2em] shadow-xl
                ${canShowStats 
                  ? 'bg-brand text-brand-dark hover:scale-[1.03] active:scale-95 shadow-[0_10px_30px_rgba(199,154,0,0.2)]' 
                  : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'
                }`}
            >
              <span className="relative z-10">
                {canShowStats ? "Analizza Statistiche" : "Statistiche Offline"}
              </span>
              {canShowStats && (
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              )}
            </button>

            {/* MESSAGGIO SUPPORTO OFFLINE */}
            {!isOnline && !hasCache && (
              <div className="pt-4 border-t border-white/5 mt-2">
                <p className="text-[9px] text-brand/40 uppercase font-black tracking-widest leading-relaxed">
                  Connettiti per sincronizzare <br /> i dati di gioco
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;