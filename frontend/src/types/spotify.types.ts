import type { SpotifyUser } from '../types/user.types';

export interface SpotifyContextType {
  deviceId: string | null;
  player: Spotify.Player | null;
}
// hooks/useSpotify.ts
export interface SpotifyContextType {
  deviceId: string | null;
  player: Spotify.Player | null;
  user: SpotifyUser | null;
}
