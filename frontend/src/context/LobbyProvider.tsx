/**
 * @file LobbyProvider.tsx
 * @description Provider React che gestisce lo stato condiviso della lobby.
 * Wrappa i componenti figli con Socket.io listener e fornisce funzioni per interagire con il backend.
 */

import  { useState } from 'react';
import type { ReactNode} from 'react';
import { socketService } from '../service/socket.service';
import type { RoomState } from '../types/lobby.types';
import type { SpotifyUser } from '../types/user.types';
import { LobbyContext } from './LobbyContext';

/**
 * Provider che gestisce lo stato della lobbystico e la comunicazione via Socket.io.
 * Deve essere posizionato come antenato dei componenti che usano useLobby().
 * 
 * @param {Object} props - Props del componente
 * @param {ReactNode} props.children - Componenti figli da wrappare
 * @returns {JSX.Element} Provider con LobbyContext
 */
export const LobbyProvider = ({ children }: { children: ReactNode }) => {
  /**
   * Stato della stanza corrente (null se non in una stanza)
   * @type {[RoomState | null, Function]}
   */
  const [room, setRoom] = useState<RoomState | null>(null);

  /**
   * Ultimo messaggio di errore ricevuto dal server
   * @type {[string | null, Function]}
   */
  const [error, setError] = useState<string | null>(null);

  /**
   * Stabilisce la connessione Socket.io e registra i listener.
   * Se la connessione è già stabilita, registra solo i nuovi listener.
   * 
   * @returns {Socket} Istanza del socket connesso
   */
  const getConnectedSocket = () => {
    const io = socketService.connect();
    
    // Listener per aggiornamenti dello stato della stanza
    io.off('room_update').on('room_update', (data: RoomState) => {
      setRoom(data);
      setError(null);
    });

    // Listener per errori dal server
    io.off('error').on('error', (msg: string) => setError(msg));
    
    return io;
  };

  /**
   * Crea una nuova stanza e aggiunge il giocatore corrente come host.
   * @param {SpotifyUser} userData - Dati dell'utente Spotify
   */
  const createRoom = (userData: SpotifyUser) => getConnectedSocket().emit('create_room', userData);

  /**
   * Unisce il giocatore a una stanza esistente.
   * @param {string} roomId - ID della stanza a cui unirsi
   * @param {SpotifyUser} userData - Dati dell'utente Spotify
   */
  const joinRoom = (roomId: string, userData: SpotifyUser) => getConnectedSocket().emit('join_room', { roomId, userData });

  /**
   * Segnala al server che il giocatore è pronto per iniziare la partita.
   * @param {string} roomId - ID della stanza
   */
  const setReady = (roomId: string) => socketService.socket?.emit('set_ready', { roomId });

  /**
   * Avvia la partita (solo disponibile per l'host della stanza).
   * @param {string} roomId - ID della stanza
   */
  const startGame = (roomId: string) => socketService.socket?.emit('start_game', { roomId });

  return (
    <LobbyContext.Provider value={{ room, error, createRoom, joinRoom, setReady, startGame }}>
      {children}
    </LobbyContext.Provider>
  );
};