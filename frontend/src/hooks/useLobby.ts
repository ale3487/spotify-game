// src/hooks/useLobby.ts
import { useContext } from 'react';
import { LobbyContext } from '../context/LobbyContext';

export const useLobby = () => {
  const context = useContext(LobbyContext);
  if (!context) {
    throw new Error('useLobby deve essere usato all\'interno di un LobbyProvider');
  }
  return context;
};