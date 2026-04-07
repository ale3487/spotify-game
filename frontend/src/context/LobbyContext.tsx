// src/context/LobbyContext.ts
import { createContext } from 'react';
import type { LobbyContextType } from '../types/lobby.types';

export const LobbyContext = createContext<LobbyContextType | undefined>(undefined);