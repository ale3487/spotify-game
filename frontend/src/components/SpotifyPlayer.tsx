/**
 * @file SpotifyPlayer.tsx
 * @description Componente React che gestisce il Spotify Web Playback SDK.
 * Inizializza il player, gestisce i token OAuth e fornisce il device ID al genitore.
 */

import React, { useEffect, useState } from 'react';

/**
 * URL del backend per le richieste API (access token refresh)
 * @type {string}
 */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

/**
 * Props del componente SpotifyPlayer
 * @interface SpotifyPlayerProps
 */
interface SpotifyPlayerProps {
  /**
   * Callback invocato quando il player è pronto
   * Riceve il device ID (per le richieste API) e l'istanza del player
   * 
   * @param {string} deviceId - ID del dispositivo Spotify Web Playback
   * @param {Spotify.Player} player - Istanza del player Spotify
   */
  onPlayerReady: (deviceId: string, player: Spotify.Player) => void;
}

/**
 * Componente Spotify Web Playback SDK Player.
 * Inizializza il player Spotify, gestisce l'autenticazione tokenica e il ciclo di vita del player.
 * 
 * @param {SpotifyPlayerProps} props - Props del componente
 * @returns {JSX.Element} Indicatore di stato del player (top-right corner)
 * 
 * @description
 * Flusso:
 * 1. Carica lo script del Spotify SDK dall'URL CDN
 * 2. Al caricamento, crea un'istanza di Spotify.Player con callback getOAuthToken
 * 3. Il callback getOAuthToken viene invocato quando il token sta per scadere
 * 4. Registra listener per i vari stati del player (ready, not_ready, errori)
 * 5. Fornisce il device ID al componente genitore tramite onPlayerReady
 * 6. Visualizza uno stato di connessione nel top-right
 */
const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ onPlayerReady }) => {
  /**
   * Istanza del Spotify Player
   * @type {[Spotify.Player | null, Function]}
   */
  const [player, setPlayer] = useState<Spotify.Player | null>(null);

  /**
   * Indica se il player è connesso e pronto
   * @type {[boolean, Function]}
   */
  const [isReady, setIsReady] = useState<boolean>(false);

  /**
   * Messaggio di errore se il player incontra problemi
   * @type {[string | null, Function]}
   */
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Caricamento dello Spotify Web Playback SDK
     * Inietta lo script nel DOM solo una volta (check su ID)
     */
    if (!document.getElementById('spotify-sdk')) {
      const script = document.createElement("script");
      script.id = 'spotify-sdk';
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    /**
     * Callback globale invocata da Spotify dopo il caricamento dello script
     * Inizializza qui il player perché a questo punto window.Spotify è disponibile
     */
    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'BeatMatch Player',

        /**
         * Callback per il recupero dinamico del token di accesso.
         * Spotify chiama questa funzione quando il token sta per scadere o è invalido.
         * Deve invocare cb(token_string) per proseguire.
         */
        getOAuthToken: async (cb) => {
          try {
            const response = await fetch(`${BACKEND_URL}/api/spotify/access_token`, {
              credentials: 'include' // Include cookies per l'autenticazione
            });
            const data = await response.json();
            cb(data.accessToken); 
          } catch (err) {
            console.error("Errore fetch access_token:", err);
            setError("Sessione scaduta");
          }
        },
        volume: 0.5 // Volume iniziale al 50%
      });

      setPlayer(spotifyPlayer);

      /**
       * LISTENER: Quando il player è pronto e connesso
       * Notifica il componente genitore con il device_id
       */
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        setIsReady(true);
        onPlayerReady(device_id, spotifyPlayer);
      });

      /**
       * LISTENER: Quando il dispositivo non è più raggiungibile
       */
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.warn('Il device ID è andato offline:', device_id);
        setIsReady(false);
      });

      /**
       * LISTENER: Errore durante l'inizializzazione dello SDK
       * Es: browser non supportato, versione SDK obsoleta
       */
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        setError("Errore Inizializzazione");
        console.error(message);
      });

      /**
       * LISTENER: Errore di autenticazione
       * Es: account non Premium, token invalido, sessione scaduta
       */
      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        setError("Errore Autenticazione");
        console.error("Account non Premium o Token invalido:", message);
      });

      /**
       * LISTENER: Errore durante il playback
       * Es: canzone non disponibile in questa regione
       */
      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error("Errore Playback:", message);
      });

      /**
       * Avvia la connessione al servizio Spotify
       */
      spotifyPlayer.connect();
    };

    /**
     * Cleanup: disconnette il player quando il componente si smonta
     */
    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, []); 

  /**
   * UI: Indicatore visivo dello stato del player (top-right corner)
   * Colore e testo cambiano in base allo stato
   */
  return (
    <div className="fixed top-8 right-6 z-[100] pointer-events-none">
      <div className={`px-4 py-2 rounded-2xl backdrop-blur-xl border transition-all duration-700 flex items-center gap-3 shadow-2xl ${
        isReady 
          ? 'bg-brand/10 border-brand/20' 
          : 'bg-white/5 border-white/10'
      }`}>
        {/* Indicatore LED con effetto luminoso */}
        <div className={`w-2 h-2 rounded-full ${
          error ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
          isReady ? 'bg-brand animate-pulse shadow-[0_0_10px_#c79a00]' : 
          'bg-yellow-500'
        }`} />
        
        {/* Etichetta stato */}
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
          {error ? error : isReady ? "Spotify Live" : "Syncing..."}
        </span>
      </div>
    </div>
  );
};

export default SpotifyPlayer;