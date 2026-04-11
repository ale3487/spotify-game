/**
 * @file lobby.types.ts
 * @description Definizioni dei tipi TypeScript per la gestione della lobby e dello stato di gioco.
 */

import type { SpotifyUser } from "./user.types";

/**
 * Rappresenta i dati pubblici di un singolo giocatore in una stanza.
 * @interface PlayerData
 */
export interface PlayerData {
  /** ID univoco del giocatore (socket ID) */
  id: string;
  /** Nome visualizzato dell'utente */
  displayName: string;
  /** True se il giocatore è l'host della stanza */
  isHost: boolean;
  /** True se il giocatore è pronto per iniziare la partita */
  isReady: boolean;
  /** ID dell'avatar di default (se l'utente non ha foto profilo Spotify) */
  defaultAvatarId: number; 
  /** URL dell'immagine profilo Spotify (null se non disponibile) */
  avatarUrl: string | null; 
}

/**
 * Rappresenta lo stato completo di una stanza di gioco.
 * @interface RoomState
 */
export interface RoomState {
  /** ID univoco di 5 caratteri della stanza */
  roomId: string;
  /** Stato attuale della partita */
  status: 'LOBBY' | 'PLAYING' | 'ENDED';
  /** Array dei giocatori presenti nella stanza */
  players: PlayerData[];
}

/**
 * Definisce il contesto globale della lobby fornito da LobbyProvider.
 * Contiene lo stato della stanza e le funzioni per interagire con Socket.io.
 * @interface LobbyContextType
 */
export interface LobbyContextType {
  /** Stato corrente della stanza o null se non in una stanza */
  room: RoomState | null;
  /** Messaggio di errore se presente, null altrimenti */
  error: string | null;
  /** Funzione per segnalare la prontezza del giocatore */
  setReady: (roomId: string) => void;
  /** Funzione per avviare la partita (solo host) */
  startGame: (roomId: string) => void;
  /** Funzione per creare una nuova stanza */
  createRoom: (userData: SpotifyUser) => void;
  /** Funzione per unirsi a una stanza esistente */
  joinRoom: (roomId: string, userData: SpotifyUser) => void;
}

/**
 * Rappresenta i dati dei testi e del ritornello di una canzone.
 * @interface LyricsData
 */
export interface LyricsData {
  /** Nome della traccia */
  track: string;
  /** Nome dell'artista */
  artist: string;
  /** Testo completo della canzone */
  lyrics: string;
  /** Timestamp d'inizio del ritornello nel formato "mm:ss.xx" */
  timestamp: string;
  /** Testo del ritornello identificato (null se non trovato) */
  chorus: string | null;
}