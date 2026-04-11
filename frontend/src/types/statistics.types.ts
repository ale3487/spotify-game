/**
 * @file statistics.types.ts
 * @description Definizioni dei tipi TypeScript per le statistiche musicali.
 * Gestisce i dati grezzi da Spotify e i dati normalizzati per la visualizzazione.
 */

import type { SpotifyUser } from "./user.types";

/**
 * Rappresenta un elemento normalizzato (artista o traccia) dalla cache.
 * Formato unificato per artisti e tracce con campi comuni.
 * 
 * @interface CachedItem
 */
export interface CachedItem {
  /** ID univoco dell'elemento */
  id: string;
  /** Nome dell'artista o della traccia */
  name: string;
  /** URL dell'immagine di copertina */
  image: string;
  /** URI Spotify per il playback */
  uri: string;
  /** Link esterno al profilo/traccia Spotify */
  link: string;
  /** Nome dell'artista (solo per tracce) */
  artist?: string;
}

/**
 * Rappresenta un artista grezzo dalla API Spotify.
 * Contiene i dati diretti dalla risposta API di Spotify.
 * 
 * @interface SpotifyArtistRaw
 */
export interface SpotifyArtistRaw {
  /** ID univoco Spotify */
  id: string;
  /** Nome dell'artista */
  name: string;
  /** URI Spotify */
  uri: string;
  /** Array di immagini in diverse risoluzioni */
  images?: { url: string }[];
  /** Link esterno */
  external_urls: { spotify: string };
}

/**
 * Rappresenta una traccia grezza dalla API Spotify.
 * Contiene i dati diretti dalla risposta API di Spotify.
 * 
 * @interface SpotifyTrackRaw
 */
export interface SpotifyTrackRaw {
  /** ID univoco Spotify */
  id: string;
  /** Nome della traccia */
  name: string;
  /** URI Spotify */
  uri: string;
  /** Array di artisti e loro dati */
  artists: { name: string }[];
  /** Dati dell'album (incluse le immagini) */
  album: { images: { url: string }[] };
  /** Link esterno */
  external_urls: { spotify: string };
}

/**
 * Union type per rappresentare qualsiasi elemento di dati grezzi.
 * 
 * @typedef {CachedItem | SpotifyArtistRaw | SpotifyTrackRaw} RawItem
 */
export type RawItem = CachedItem | SpotifyArtistRaw | SpotifyTrackRaw;

/**
 * Rappresenta la risposta normalizzata dal backend per Top Artists/Tracks.
 * Contiene i dati elaborati e metadati sulla cache.
 * 
 * @interface BackendResponse
 */
export interface BackendResponse {
  /** Array di dati normalizzati (artisti o tracce) */
  data: RawItem[];
  
  /** Numero totale di elementi disponibili da Spotify */
  total?: number;
  
  /** Tipo di dato ("artists" o "tracks") */
  type?: string;
  
  /** Range temporale ("short_term", "medium_term", "long_term") */
  range?: string;
  
  /** True se i dati provengono dalla cache, false se da API Spotify */
  cached?: boolean;
}

/**
 * Rappresenta un elemento normalizzato pronto per la visualizzazione.
 * Formato unificato sia per artisti che per tracce.
 * 
 * @interface TrackOrArtist
 */
export interface TrackOrArtist {
  /** ID univoco */
  id: string;
  
  /** Nome dell'artista (solo per tracce) */
  artist?: string;
  
  /** Nome del titolo (traccia o artista) */
  name: string;
  
  /** URL dell'immagine da visualizzare */
  image: string;
  
  /** URI Spotify per il playback */
  uri: string;
  
  /** Link esterno Spotify */
  link: string;
}

/**
 * Props del componente Statistics.
 * Contiene i dati dell'utente e lo stato online/offline.
 * 
 * @interface StatisticsProps
 */
export interface StatisticsProps {
  /** Profilo dell'utente autenticato (null se non autenticato) */
  user: SpotifyUser | null;
  
  /** True se il client è offline (nessuna connessione internet) */
  isOffline?: boolean;
}