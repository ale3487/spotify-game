/**
 * @file spotify.service.ts
 * @description Servizio per la gestione dell'autenticazione OAuth2 con protocollo PKCE
 * e per l'interazione con le API di Spotify tramite il backend proprietario.
 * Implementa il flusso di login, lo scambio token, la persistenza di sessione e il recupero dei dati utente.
 */

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

/**
 * Genera una stringa casuale crittograficamente sicura.
 * Utilizzata per il Code Verifier nel flusso PKCE.
 * 
 * @param {number} length - Lunghezza della stringa da generare
 * @returns {string} Stringa alfanumerica casuale
 * 
 * @description Usa crypto.getRandomValues() per garantire casualità crittografica
 */
const generateRandomString = (length: number): string => {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

/**
 * Calcola l'hash SHA-256 di una stringa.
 * Utilizzato per generare il Code Challenge dal Code Verifier nel PKCE.
 * 
 * @async
 * @param {string} plain - La stringa di input (Code Verifier)
 * @returns {Promise<ArrayBuffer>} Promise che risolve in un ArrayBuffer contenente l'hash SHA-256
 * 
 * @description Usa Web Crypto API (window.crypto.subtle.digest)
 */
const sha256 = async (plain: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
};

/**
 * Codifica un ArrayBuffer in formato Base64URL (RFC 4648).
 * Rimuove padding, '+', '/' come richiesto da Spotify PKCE.
 * 
 * @param {ArrayBuffer} input - L'hash (ArrayBuffer) da codificare
 * @returns {string} Stringa codificata pronta per l'uso nell'URL di Spotify
 */
const base64encode = (input: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

/**
 * Avvia il processo di autenticazione Spotify (OAuth2 PKCE Flow).
 * Genera il Code Verifier e Code Challenge, li salva localmente,
 * e reindirizza l'utente alla pagina di autorizzazione di Spotify.
 * 
 * @async
 * @returns {Promise<void>}
 * 
 * @description Flow:
 * 1. Genera Code Verifier (stringa casuale 64 caratteri)
 * 2. Calcola Code Challenge (hash SHA-256 del verifier)
 * 3. Salva il verifier in localStorage per la fase di callback
 * 4. Reindirizza a https://accounts.spotify.com/authorize con i parametri PKCE
 */
export async function loginSpotify(): Promise<void> {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  /**
   * Memorizza il verifier per uso nella fase di callback di autenticazione
   */
  localStorage.setItem("code_verifier", codeVerifier);

  /**
   * Scopes richiesti a Spotify:
   * - user-read-private: Accesso al profilo privato
   * - user-read-email: Accesso all'email
   * - user-top-read: Accesso agli artisti/tracce preferite
   * - streaming: Accesso al Spotify Web Playback SDK
   */
  const scope = "user-read-private user-read-email user-top-read streaming ";
  const authUrl = new URL("https://accounts.spotify.com/authorize");
  
  authUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID!,
    scope,
    redirect_uri: REDIRECT_URI!,
    code_challenge_method: "S256", // PKCE con SHA-256
    code_challenge: codeChallenge,
  }).toString();

  window.location.href = authUrl.toString();
}

/**
 * Gestisce la callback di Spotify dopo il redirect.
 * Invia il 'code' e il 'code_verifier' al backend per scambiarlo con i token di accesso.
 * 
 * @async
 * @returns {Promise<any>} Dati dell'utente autenticato o undefined in caso di errore/mancanza codice
 * 
 * @description Flow:
 * 1. Estrae il 'code' dai parametri URL
 * 2. Recupera il 'code_verifier' da localStorage
 * 3. Lo invia al backend tramite POST /api/spotify/login
 * 4. Pulisce il localStorage dal code_verifier
 */
export async function exchangeToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (!code) return;

  const codeVerifier = localStorage.getItem("code_verifier");
  if (!codeVerifier) {
    console.error("Code verifier non trovato: sessione scaduta o browser non supportato.");
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/spotify/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      /**
       * 'credentials: include' è FONDAMENTALE per permettere al backend 
       * di settare i cookie HttpOnly (Secure) per la sessione JWT.
       * Senza questa opzione, i cookie non vengono inviati o ricevuti.
       */
      credentials: "include", 
      body: JSON.stringify({ code, code_verifier: codeVerifier }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Errore durante il login");

    /**
     * Pulizia dei dati temporanei di sicurezza dal localStorage
     */
    localStorage.removeItem("code_verifier");

    return data;
  } catch (err) {
    console.error("Errore critico durante lo scambio del token:", err);
    throw err;
  }
}

/**
 * Verifica se esiste una sessione valida nel backend.
 * Recupera i dati dell'utente autenticato tramite il JWT salvato nei cookie.
 * Se offline, ritorna i dati dal backup locale.
 * 
 * @async
 * @returns {Promise<any>} Dati dell'utente o null se nessuna sessione attiva
 * 
 * @description Implementa offline-first:
 * Se il server è raggiungibile, ritorna i dati dall'API e li salva nel backup.
 * Se offline, ritorna i dati dal backup locale (se disponibile).
 */
export async function checkSession() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/spotify/me`, {
      method: "GET",
      credentials: "include", // Include the JWT cookie
    });

    if (res.ok) {
      const userData = await res.json();
      /**
       * Salva una copia per il supporto offline
       */
      localStorage.setItem('beatmatch_user_backup', JSON.stringify(userData));
      return userData;
    }
    
    return null;
  } catch (err) {
    console.warn("Offline o errore server, cerco nel backup locale...");
    const backup = localStorage.getItem('beatmatch_user_backup');
    console.error("Errore durante il controllo sessione:", err);
    return backup ? JSON.parse(backup) : null;
  }
}

/**
 * Recupera le statistiche (Top Artists o Top Tracks) dell'utente da Spotify.
 * Le statistiche vengono cachate dal backend per 24 ore.
 * 
 * @async
 * @param {('artists' | 'tracks')} type - Tipo di dato da recuperare (artists o tracks)
 * @param {string} range - Periodo temporale:
 *   - short_term: Ultimi ~4 settimane
 *   - medium_term: Ultimi ~6 mesi
 *   - long_term: Ultimo anno
 * @returns {Promise<any>} Array normalizzato di artisti/tracce con metadati di cache
 * 
 * @example
 * const topArtists = await fetchTopUser('artists', 'long_term');
 */
export async function fetchTopUser(type: "artists" | "tracks", range: string) {
  const res = await fetch(`${BACKEND_URL}/api/spotify/TopUser?type=${type}&range=${range}`, {
    method: "GET",
    credentials: "include", // Include the JWT cookie
  });
  
  if (!res.ok) {
    throw new Error(`Errore durante il recupero dei top ${type}: ${res.statusText}`);
  }
  
  return await res.json();
}

/**
 * Verifica se esiste una specifica cache nel browser.
 * Utile per determinare se ci sono dati cachati disponibili per il supporto offline.
 * 
 * @async
 * @param {string} [cacheName='beatmatch-api-cache'] - Nome della cache da controllare
 * @returns {Promise<boolean>} True se la cache esiste e contiene dati, false altrimenti
 */
export const checkCacheStatus = async (cacheName: string = 'beatmatch-api-cache'): Promise<boolean> => {
  if (!('caches' in window)) return false;

  try {
    const cacheNames = await caches.keys();
    if (!cacheNames.includes(cacheName)) return false;

    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    /**
     * Ritorna true se ci sono almeno delle richieste salvate nella cache
     */
    return requests.length > 0;
  } catch (error) {
    console.error("Errore nel controllo cache:", error);
    return false;
  }
};

/**
 * Recupera i testi delle top 5 canzoni dell'utente.
 * Il backend gestisce la logica di caching e fallback tramite lrclib.net.
 * Ritorna i testi completi, il ritornello e il timestamp d'inizio del ritornello.
 * 
 * @async
 * @returns {Promise<any>} Oggetto con array di testi e metadati
 * @throws {Error} Se la richiesta fallisce
 * 
 * @example
 * const lyrics = await fetchLyrics();
 * // lyrics.lyrics contiene array di track con testi, ritornello, e timestamp
 */
export async function fetchLyrics(roomId: string | undefined) {
  if (!roomId) return console.error("RoomID mancante nel fetch!");

  const res = await fetch(`${BACKEND_URL}/api/spotify/lyrics?roomId=${roomId}`, {
    method: "GET",
    credentials: "include", 
  });

  if (!res.ok) {
    throw new Error(`Errore durante il recupero dei testi: ${res.statusText}`);
  }
  return await res.json();
}
