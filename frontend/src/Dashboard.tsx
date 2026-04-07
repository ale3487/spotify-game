/**
 * @file Dashboard.tsx
 * @description Hub principale con supporto Creazione e Join stanza.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { checkCacheStatus } from './spotify.service'; 
import type { SpotifyUser } from './types/user.types';

// --- IMPORT SOCKET LOGIC ---
import { useLobby } from './hooks/useLobby';

// --- IMPORT COMPONENTI CORE ---
import { NeonBackground } from './components/NeonBackground';
import { MouseTracker } from './components/MouseTracker';
import { Logo } from './components/Logo';

const Dashboard = ({ user }: { user: SpotifyUser | null }) => {
  const navigate = useNavigate();
  
  // Estraiamo le funzioni necessarie dal context
  const { createRoom, joinRoom, room, error: lobbyError } = useLobby();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasCache, setHasCache] = useState(false);
  
  // Stato per il codice della stanza da inserire
  const [joinCode, setJoinCode] = useState("");

  // Monitoraggio navigazione automatica alla lobby
  useEffect(() => {
    if (room?.roomId) {
      navigate(`/lobby/${room.roomId}`);
    }
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

  const handleStartGame = () => {
    if (isOnline && user) createRoom(user);
  };

  /**
   * AZIONE: Partecipa a una stanza esistente
   */
  const handleJoinGame = () => {
    if (isOnline && user && joinCode.length === 5) {
      joinRoom(joinCode.toUpperCase(), user);
    }
  };

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
      <NeonBackground />
      <MouseTracker />

      <main className="max-w-md w-full px-6 relative z-10">
        <div className="flex justify-center mb-8">
           <Logo size="md" />
        </div>

        <div className="bg-glass-gradient backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 text-center shadow-2xl relative transition-all duration-500 hover:border-white/20">
          
          {/* AVATAR SECTION */}
          <div className="mb-8 flex justify-center">
            {user.images && user.images.length > 0 ? (
              <img 
                src={user.images[0].url} 
                alt="Profile" 
                className={`w-32 h-32 rounded-full border-4 object-cover shadow-2xl transition-all duration-500 ${isOnline ? 'border-brand/40' : 'border-white/10 grayscale opacity-70'}`} 
              />
            ) : (
              <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center shadow-lg transition-all duration-500 ${avatarStyles[avatarId]}`}>
                <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </div>

          <div className="space-y-1 mb-8">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none">
              {user.display_name}
            </h1>
          </div>

          <div className="flex flex-col gap-4">
            
            {/* BOTTONE CREA (HOST) */}
            <button 
              disabled={!isOnline}
              onClick={handleStartGame}
              className={`group relative overflow-hidden w-full font-black py-4 rounded-2xl transition-all transform uppercase text-[10px] tracking-[0.2em] shadow-xl
                ${isOnline ? 'bg-emerald-500 text-black hover:scale-[1.02]' : 'bg-white/5 text-white/10'}`}
            >
              Crea Nuova Stanza
            </button>

            {/* SEZIONE JOIN (PLAYER) */}
            <div className="flex flex-col gap-2 p-4 bg-white/5 rounded-2xl border border-white/10">
              <input 
                type="text"
                placeholder="Codice Stanza"
                value={joinCode}
                maxLength={5}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="bg-transparent text-center font-black tracking-[0.5em] text-lg uppercase focus:outline-none placeholder:text-white/20 placeholder:tracking-normal placeholder:text-[10px]"
              />
              <button 
                disabled={!isOnline || joinCode.length !== 5}
                onClick={handleJoinGame}
                className={`w-full font-black py-3 rounded-xl transition-all uppercase text-[9px] tracking-[0.2em]
                  ${isOnline && joinCode.length === 5 ? 'bg-brand text-black' : 'bg-white/5 text-white/20'}`}
              >
                Entra in Partita
              </button>
            </div>

            {lobbyError && (
              <p className="text-red-500 text-[9px] font-black uppercase tracking-widest animate-pulse">
                {lobbyError}
              </p>
            )}

            <button 
              disabled={!canShowStats}
              onClick={() => navigate("/statistics")}
              className="w-full font-black py-4 rounded-2xl transition-all uppercase text-[10px] tracking-[0.2em] border border-white/10 text-white/60 hover:bg-white/5"
            >
              Statistiche
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;