/**
 * @file user.types.ts
 * @description Definizioni dei tipi TypeScript per i dati dell'utente Spotify.
 */

/**
 * Rappresenta il profilo dell'utente autenticato tramite Spotify OAuth2.
 * Contiene i dati pubblici e le immagini del profilo.
 * 
 * @interface SpotifyUser
 */
export interface SpotifyUser {
  /**
   * Identificativo univoco del profilo Spotify
   * @type {string}
   */
  spotifyId: string;
  
  /**
   * Nome visualizzato dall'utente nel profilo Spotify
   * @type {string}
   */
  display_name: string;
  
  /**
   * Indirizzo email associato all'account Spotify
   * @type {string}
   */
  email: string;
  
  /**
   * Array di immagini del profilo (diverse risoluzioni)
   * Null se l'utente non ha caricato una foto profilo
   * @type {Array<{url: string}> | null}
   */
  images: { url: string }[] | null;
  
  /**
   * ID per l'avatar generato dal backend (fallback se images è null)
   * Numeri da 1 a 5 per selezionare avatar pre-generati
   * @type {number | null}
   */
  defaultAvatarId: number | null;
}