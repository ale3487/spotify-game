/**
 * @file LobbyContext.tsx
 * @description Definizione del contesto React per la lobby.
 * Fornisce accesso centralizzato allo stato della stanza e alle funzioni Socket.io.
 */

import { createContext } from 'react';
import type { LobbyContextType } from '../types/lobby.types';

/**
 * Contesto globale per la gestione della lobby.
 * Deve essere consumato tramite l'hook useLobby().
 * 
 * @type {React.Context<LobbyContextType | undefined>}
 */
export const LobbyContext = createContext<LobbyContextType | undefined>(undefined);