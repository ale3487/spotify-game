// src/context/LobbyProvider.tsx
import  { useState } from 'react';
import type { ReactNode} from 'react';
import { socketService } from '../socket.service';
import type { RoomState } from '../types/lobby.types';
import type { SpotifyUser } from '../types/user.types';
import { LobbyContext } from './LobbyContext';

export const LobbyProvider = ({ children }: { children: ReactNode }) => {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getConnectedSocket = () => {
    const io = socketService.connect();
    
    io.off('room_update').on('room_update', (data: RoomState) => {
      setRoom(data);
      setError(null);
    });

    io.off('error').on('error', (msg: string) => {
      setError(msg);
    });

    return io;
  };

  const createRoom = (userData: SpotifyUser) => {
    const io = getConnectedSocket();
    io.emit('create_room', userData);
  };

  const joinRoom = (roomId: string, userData: SpotifyUser) => {
    const io = getConnectedSocket();
    io.emit('join_room', { roomId, userData });
  };

  const toggleReady = (roomId: string) => {
    const io = socketService.socket;
    if (io) io.emit('toggle_ready', roomId);
  };

  return (
    <LobbyContext.Provider value={{ room, error, createRoom, joinRoom, toggleReady }}>
      {children}
    </LobbyContext.Provider>
  );
};