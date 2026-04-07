import type { SpotifyUser } from "./user.types";
export interface CachedItem {
  id: string;
  name: string;
  image: string;
  link: string;
  artist?: string;
}

export interface SpotifyArtistRaw {
  id: string;
  name: string;
  images?: { url: string }[];
  external_urls: { spotify: string };
}

export interface SpotifyTrackRaw {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  external_urls: { spotify: string };
}

export type RawItem = CachedItem | SpotifyArtistRaw | SpotifyTrackRaw;

export interface BackendResponse {
  data: RawItem[];
  total?: number;
  type?: string;
  range?: string;
  cached?: boolean;
}

export interface TrackOrArtist {
  id: string;
  artist?: string; 
  name: string;
  image: string;
  link: string;
}

export interface StatisticsProps {
  user: SpotifyUser | null;
  isOffline?: boolean;
}