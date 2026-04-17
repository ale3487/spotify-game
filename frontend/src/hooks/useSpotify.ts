/**
 * @file useSpotify.ts
 * @description Hook personalizzato per accedere al contesto SpotifyContext.
 * Fornisce un modo conveniente e type-safe per usare lo stato di Spotify (deviceId, player, user).
 * Deve essere usato solo all'interno di componenti figli di SpotifyProvider.
 */
import { useContext, createContext } from 'react';
import type { SpotifyContextType } from '../types/spotify.types';

export const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);
/**
 * Hook per accedere al contesto dello SpotifyProvider.
 * Deve essere usato solo all'interno di componenti figli di SpotifyProvider.
 * 
 * @returns {SpotifyContextType} Oggetto con stato e funzioni di Spotify
 * @throws {Error} Se usato al di fuori di un SpotifyProvider
 * 
 * @example
 * const { deviceId, player } = useSpotify();
 */
export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify deve essere usato dentro un SpotifyProvider');
  }
  return context;
};