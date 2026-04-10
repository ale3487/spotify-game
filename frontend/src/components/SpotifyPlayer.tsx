import React, { useEffect, useState } from 'react';

/**
 * @interface SpotifyPlayerProps
 * @description Props per il componente SpotifyPlayer.
 */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

interface SpotifyPlayerProps {
  onPlayerReady: (deviceId: string, player: Spotify.Player) => void;
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ onPlayerReady }) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Inserimento dello script dell'SDK nel DOM
    if (!document.getElementById('spotify-sdk')) {
      const script = document.createElement("script");
      script.id = 'spotify-sdk';
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    // 2. Definizione dell'inizializzazione una volta caricato lo script
    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'BeatMatch Player',

        /**
         * Recupero dinamico del token:
         * Spotify chiama questa funzione ogni volta che il token sta per scadere
         * o deve autenticare una nuova sessione.
         */
        getOAuthToken: async (cb) => {
          try {
            const response = await fetch(`${BACKEND_URL}/api/spotify/access_token`
              , { credentials: 'include' } // Invia i cookie per sessioni autenticati
            );
            const data = await response.json();
            cb(data.accessToken); 
          } catch (err) {
            console.error("Errore fetch access_token:", err);
            setError("Sessione scaduta");
          }
        },
        volume: 0.5
      });

      setPlayer(spotifyPlayer);

      // --- LISTENER STATO DISPOSITIVO ---
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        setIsReady(true);
        onPlayerReady(device_id, spotifyPlayer);
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.warn('Il device ID è andato offline:', device_id);
        setIsReady(false);
      });

      // --- GESTIONE ERRORI ---
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        setError("Errore Inizializzazione");
        console.error(message);
      });

      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        setError("Errore Autenticazione");
        console.error("Account non Premium o Token invalido:", message);
      });

      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error("Errore Playback:", message);
      });

      // Avvio connessione
      spotifyPlayer.connect();
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, []); 

  // Feedback visivo posizionato nell'angolo della pagina
  return (
    <div className="fixed -top-0.1 right-6 z-[100] pointer-events-none">
      <div className={`px-4 py-2 rounded-2xl backdrop-blur-xl border transition-all duration-700 flex items-center gap-3 shadow-2xl ${
        isReady 
          ? 'bg-brand/10 border-brand/20' 
          : 'bg-white/5 border-white/10'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          error ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
          isReady ? 'bg-brand animate-pulse shadow-[0_0_10px_#c79a00]' : 
          'bg-yellow-500'
        }`} />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
          {error ? error : isReady ? "Spotify Live" : "Syncing..."}
        </span>
      </div>
    </div>
  );
};

export default SpotifyPlayer;