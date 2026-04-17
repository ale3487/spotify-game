/**
 * @file SpotifyContext.tsx
 * @description Provider per il contesto globale del player Spotify Web Playback SDK.
 * Gestisce l'inizializzazione del player, la sincronizzazione del dispositivo e la pausa automatica al cambio pagina.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // <--- Importa questo
import { SpotifyContext } from '../hooks/useSpotify';
import type { SpotifyUser } from '../types/user.types';
import type { SpotifyContextType } from '../types/spotify.types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

/**
 * Provider del contesto Spotify.
 * Inizializza il player Spotify Web Playback SDK, gestisce il device ID
 * e fornisce il player globale all'applicazione.
 *
 * @param children - Componenti figli che ricevono il contesto
 * @param user - Utente autenticato o null
 * @returns Provider del contesto Spotify
 */
export const SpotifyProvider = ({ children, user }: { children: React.ReactNode, user: SpotifyUser | null }) => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  
  const location = useLocation();

  // effetto per mettere in pausa il player quando si cambia pagina
  useEffect(() => {
    if (player) {
      player.pause().catch(() => {
        // Ignoriamo l'errore se il player non è ancora inizializzato correttamente
      });
    }
  }, [location.pathname, player]); // Si attiva ogni volta che cambia il percorso

  useEffect(() => {
    if (!user || player) return;

    const initSpotify = async () => {
      try {
        if (!document.getElementById('spotify-sdk')) {
          const script = document.createElement("script");
          script.id = 'spotify-sdk';
          script.src = "https://sdk.scdn.co/spotify-player.js";
          script.async = true;
          document.body.appendChild(script);
        }

        window.onSpotifyWebPlaybackSDKReady = () => {
          const spPlayer = new window.Spotify.Player({
            name: 'BeatMatch Global Player',
            getOAuthToken: async (cb) => {
              try {
                const response = await fetch(`${BACKEND_URL}/api/spotify/access_token`, { credentials: 'include' });
                const data = await response.json();
                cb(data.accessToken);
              } catch (err) {
                console.error(" Errore refresh token:", err);
              }
            },
            volume: 0.6
          });

          spPlayer.addListener('ready', ({ device_id }) => {
            setDeviceId(device_id);
          });

          spPlayer.connect();
          setPlayer(spPlayer);
        };
      } catch (err) {
        console.error("Errore:", err);
      }
    };

    initSpotify();
  }, [user]);

  const value: SpotifyContextType = { deviceId, player, user };

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  );
};