/**
 * @file useLobby.ts
 * @description Hook personalizzato per accedere al contesto LobbyContext.
 * Fornisce un modo conveniente e type-safe per usare lo stato della lobby.
 */

import { useContext } from 'react';
import { LobbyContext } from '../context/LobbyContext';

/**
 * Hook per accedere al contesto della lobby.
 * Deve essere usato solo all'interno di componenti figli di LobbyProvider.
 * 
 * @returns {LobbyContextType} Oggetto con stato e funzioni della lobby
 * @throws {Error} Se usato al di fuori di un LobbyProvider
 * 
 * @example
 * const { room, createRoom, setReady } = useLobby();
 */
export const useLobby = () => {
  const context = useContext(LobbyContext);
  if (!context) {
    throw new Error('useLobby deve essere usato all\'interno di un LobbyProvider');
  }
  return context;
};