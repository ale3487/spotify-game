/**
 * @file spotify.service.ts
 * @description Servizio per la gestione dell'autenticazione OAuth2 con protocollo PKCE
 * e per l'interazione con le API di Spotify tramite il backend proprietario.
 */

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

/**
 * Genera una stringa casuale crittograficamente sicura.
 * Utilizzata per il Code Verifier nel flusso PKCE.
 * @param length - Lunghezza della stringa da generare.
 * @returns Stringa alfanumerica casuale.
 */
const generateRandomString = (length: number): string => {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

/**
 * Calcola l'hash SHA-256 di una stringa.
 * @param plain - La stringa di input (Code Verifier).
 * @returns Un Promise che risolve in un ArrayBuffer contenente l'hash.
 */
const sha256 = async (plain: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
};

/**
 * Codifica un ArrayBuffer in formato Base64URL (RFC 4648).
 * @param input - L'hash da codificare.
 * @returns Stringa codificata pronta per l'uso nell'URL di Spotify.
 */
const base64encode = (input: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

/**
 * Avvia il processo di autenticazione Spotify (PKCE Flow).
 * Genera le chiavi di sicurezza, le salva localmente e reindirizza l'utente 
 * alla pagina di autorizzazione ufficiale di Spotify.
 */
export async function loginSpotify(): Promise<void> {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  // Memorizza il verifier per convalidare lo scambio del token nella fase successiva
  localStorage.setItem("code_verifier", codeVerifier);

  const scope = "user-read-private user-read-email user-top-read";
  const authUrl = new URL("https://accounts.spotify.com/authorize");
  
  authUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID!,
    scope,
    redirect_uri: REDIRECT_URI!,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  }).toString();

  window.location.href = authUrl.toString();
}

/**
 * Gestisce la callback di Spotify dopo il redirect.
 * Invia il 'code' e il 'code_verifier' al backend per ottenere i token di accesso.
 * @returns I dati dell'utente autenticato o undefined in caso di errore/mancanza codice.
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
       * 'credentials: include' è fondamentale per permettere al backend 
       * di settare i cookie HttpOnly (Secure) per la sessione.
       */
      credentials: "include", 
      body: JSON.stringify({ code, code_verifier: codeVerifier }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Errore durante il login");

    // Pulizia dei dati temporanei di sicurezza
    localStorage.removeItem("code_verifier");

    return data;
  } catch (err) {
    console.error("Errore critico durante lo scambio del token:", err);
    throw err;
  }
}

export async function checkSession() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/spotify/me`, {
      method: "GET",
      credentials: "include",
    });

    if (res.ok) {
      const userData = await res.json();
      // Salviamo una copia per le emergenze offline
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
 * Recupera le statistiche (Top Artists o Top Tracks) dell'utente.
 * @param type - Specifica se recuperare 'artists' o 'tracks'.
 * @param range - Periodo temporale (short_term, medium_term, long_term).
 * @returns Array di dati normalizzati o provenienti dalla cache del backend.
 */
export async function fetchTopUser(type: "artists" | "tracks", range: string) {
  const res = await fetch(`${BACKEND_URL}/api/spotify/TopUser?type=${type}&range=${range}`, {
    method: "GET",
    credentials: "include", 
  });
  
  if (!res.ok) {
    throw new Error(`Errore durante il recupero dei top ${type}: ${res.statusText}`);
  }
  
  return await res.json();
}

/**
 * Verifica se esiste una specifica cache e se contiene dati.
 * @param cacheName Il nome della cache da controllare
 * @returns Promise<boolean>
 */
export const checkCacheStatus = async (cacheName: string = 'beatmatch-api-cache'): Promise<boolean> => {
  if (!('caches' in window)) return false;

  try {
    const cacheNames = await caches.keys();
    if (!cacheNames.includes(cacheName)) return false;

    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    // Ritorna true se ci sono almeno delle richieste salvate
    return requests.length > 0;
  } catch (error) {
    console.error("Errore nel controllo cache:", error);
    return false;
  }
};
