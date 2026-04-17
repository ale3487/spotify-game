/**
 * Interfaccia per il ranking dei giocatori in un round.
 */
export interface PlayerRanking {
  displayName: string;
  imageUrl: string | null;
  defaultAvatarId: number | null;
  score: number;
}

/**
 * Interfaccia per i risultati di un round.
 */
export interface RoundResults {
  correctAnswer: string;
  track: {
    track: string;
    artist: string;
    trackUri: string;
  };
  rankings: PlayerRanking[];
}

/**
 * Interfaccia per il feedback di risposta del giocatore.
 */
export interface Feedback {
  isCorrect: boolean;
  points: number;
}

/**
 * Interfaccia per i comandi di gioco ricevuti dal server.
 */
export interface GameCommand {
  trackUri: string;
  timestamp: string | number;
  trackName?: string;
  artist: string;
  image?: string;
  options?: string[];
  round?: number;
}