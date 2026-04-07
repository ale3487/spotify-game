/**
 * Rappresenta il profilo dell'utente autenticato tramite Spotify.
 */
export interface SpotifyUser {
  /** Identificativo univoco di Spotify */
  spotifyId: string;
  /** Nome visualizzato dall'utente */
  display_name: string;
  /** Indirizzo email dell'account */
  email: string;
  /** Array di immagini del profilo (se presenti) */
  images: { url: string }[] | null;
  /** ID per l'avatar generato dal backend (opzionale) */
  defaultAvatarId: number | null;
}