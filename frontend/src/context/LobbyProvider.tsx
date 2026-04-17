/**
 * @file LobbyProvider.tsx
 * @description Provider con funzioni stabilizzate tramite useCallback per evitare loop infiniti.
 */

import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { socketService } from '../service/socket.service';
import type { RoomState } from '../types/lobby.types';
import type { SpotifyUser } from '../types/user.types';
import { LobbyContext } from './LobbyContext';

export const LobbyProvider = ({ children }: { children: ReactNode }) => {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Funzione per connettersi al socket e stabilire i listener.
   */
  const getConnectedSocket = useCallback(() => {
    const io = socketService.connect();
    
    io.off('room_update').on('room_update', (data: RoomState) => {
      setRoom(data);
      setError(null);
    });

    io.off('error').on('error', (msg: string) => setError(msg));
    
    return io;
  }, []);

  // Stabilizziamo tutte le funzioni del context
  
  /**
   * Funzione per creare una nuova stanza. Invia i dati dell'utente al server tramite socket.
   * @param userData - Dati dell'utente che crea la stanza
   */
  const createRoom = useCallback((userData: SpotifyUser) => {
    getConnectedSocket().emit('create_room', userData);
  }, [getConnectedSocket]);

  /**
   * Funzione per unirsi a una stanza esistente. Invia l'ID della stanza e i dati dell'utente al server tramite socket.
   * @param roomId - ID della stanza a cui unirsi
   * @param userData - Dati dell'utente che si unisce alla stanza
   */
  const joinRoom = useCallback((roomId: string, userData: SpotifyUser) => {
    getConnectedSocket().emit('join_room', { roomId, userData });
  }, [getConnectedSocket]);

  /**
   * Funzione per segnalare che un giocatore è pronto. Invia l'ID della stanza al server tramite socket.
   * @param roomId - ID della stanza in cui il giocatore è pronto
   */
  const setReady = useCallback((roomId: string) => {
    socketService.socket?.emit('set_ready', { roomId });
  }, []);

  /**
   * Funzione per iniziare il gioco. Invia l'ID della stanza al server tramite socket.
   * @param roomId - ID della stanza in cui iniziare il gioco
   */
  const startGame = useCallback((roomId: string) => {
    socketService.socket?.emit('start_game', { roomId });
  }, []);

  /**
   * Funzione per lasciare la stanza. Invia l'ID della stanza al server tramite socket e resetta lo stato locale.
   * @param roomId - ID della stanza da lasciare
   */
  const leaveRoom = useCallback((roomId: string) => {
    if (socketService.socket) {
      socketService.socket.emit('leave_room', roomId);
    }
    setRoom(null);
    setError(null);
  }, []);

  return (
    <LobbyContext.Provider 
      value={{ 
        room, 
        error, 
        createRoom, 
        joinRoom, 
        setReady, 
        startGame, 
        leaveRoom 
      }}
    >
      {children}
    </LobbyContext.Provider>
  );
};