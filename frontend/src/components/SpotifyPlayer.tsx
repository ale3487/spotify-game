import React from 'react';
import { useSpotify } from '../hooks/useSpotify';
import { useLocation } from 'react-router-dom';

const SpotifyPlayer: React.FC = () => {
  const { deviceId, user } = useSpotify();
  const location = useLocation();
  // dove nascondere il widget spotify
  // Se non c'è l'utente OPPURE se siamo nella pagina di login ("/")
  if (!user || location.pathname === "/") {
    return null;
  }

  const isReady = !!deviceId;

  return (
    <div className="fixed top-8 right-6 z-[100] pointer-events-none">
      <div className={`px-4 py-2 rounded-2xl backdrop-blur-xl border transition-all duration-700 flex items-center gap-3 shadow-2xl ${
        isReady ? 'bg-brand/10 border-brand/20' : 'bg-white/5 border-white/10'
      }`}>
        {/* Pallino di stato */}
        <div className={`w-2 h-2 rounded-full ${
          isReady ? 'bg-brand animate-pulse' : 'bg-yellow-500'
        }`} />
        
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
          {isReady ? "Spotify attivo" : "sincronizzazione"}
        </span>
      </div>
    </div>
  );
};

export default SpotifyPlayer;