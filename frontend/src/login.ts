// login.ts
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

const generateRandomString = (length: number) => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
};

const base64encode = (input: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};


export async function loginSpotify() {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

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

// Callback handler: scambia il code con i token
export async function exchangeToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (!code) return;

  const codeVerifier = localStorage.getItem("code_verifier");
  if (!codeVerifier) return console.error("Code verifier non trovato");

  try {
    console.log("Richiesta token al backend...");
    
    const res = await fetch(`${BACKEND_URL}/api/spotify/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // FONDAMENTALE: permette al browser di ricevere e salvare il cookie httpOnly
      credentials: "include", 
      body: JSON.stringify({ code, code_verifier: codeVerifier }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Errore durante il login");

    // PULIZIA: Rimuoviamo il verifier perché non serve più
    localStorage.removeItem("code_verifier");

    return data;

  } catch (err) {
    console.error("Errore exchangeToken:", err);
    throw err;
  }
}

// NUOVA FUNZIONE: Da chiamare nell'App.js per recuperare la sessione al refresh
export async function checkSession() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/spotify/me`, {
      method: "GET",
      credentials: "include", // Invia il cookie al backend per farsi riconoscere
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Errore checkSession:", err);
    return null;
  }
}

export async function fetchTopUser(type: "artists" | "tracks", range: string) {
  const res = await fetch(`${BACKEND_URL}/api/spotify/TopUser?type=${type}&range=${range}`, {
    method: "GET",
    credentials: "include", 
  });
  if (!res.ok) 
    throw new Error(`Errore fetching top ${type}: ${res.statusText}`);
  return await res.json();
}
