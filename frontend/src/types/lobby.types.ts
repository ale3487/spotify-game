import type { SpotifyUser } from "./user.types";
export interface Player {
  id: string;          // Socket ID
  displayName: string;
  avatarUrl?: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
}

export interface RoomState {
  roomId: string;
  status: 'LOBBY' | 'PLAYING' | 'RESULTS';
  players: Player[];
}

export interface LobbyContextType {
  room: RoomState | null;
  error: string | null;
  createRoom: (userData: SpotifyUser) => void;
  joinRoom: (roomId: string, userData: SpotifyUser) => void;
  toggleReady: (roomId: string) => void;
}

export interface LyricsData {
  track: string;
  artist: string;
  lyrics: string;
  timestamp: string;
  chorus: string | null;
}