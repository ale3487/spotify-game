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

// Salva code_verifier e redirect verso Spotify
export async function loginSpotify() {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  localStorage.setItem("code_verifier", codeVerifier);

  const scope = "user-read-private user-read-email";
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

  // Se non c'è code, esci subito
  if (!code) return;

  // Se access_token già presente, non rifare la richiesta
  if (localStorage.getItem("access_token")) {
    console.log("Token già presente");
    return;
  }

  const codeVerifier = localStorage.getItem("code_verifier");
  if (!codeVerifier) return console.error("Code verifier non trovato");

  try {
    console.log("Sto facendo la richiesta token...");
    const res = await fetch(`${BACKEND_URL}/api/spotify/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, code_verifier: codeVerifier }),
    });

    const data = await res.json();
    if (data.error) return console.error("Errore ottenendo il token:", data);

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);

    console.log("Access token ottenuto:", data.access_token);
    console.log("Refresh token ottenuto:", data.refresh_token);

    if (data.expires_in) setupAutoRefresh(data.expires_in);
  } catch (err) {
    console.error("Errore exchangeToken:", err);
  }
}

// Refresh automatico del token usando il backend
export async function refreshToken() {
  const refresh_token = localStorage.getItem("refresh_token");
  if (!refresh_token) return;

  try {
    const res = await fetch(`${BACKEND_URL}/api/spotify/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });
    const data = await res.json();
    if (data.error) return console.error("Errore refresh token:", data);

    localStorage.setItem("access_token", data.access_token);
    console.log("Access token rinfrescato:", data.access_token);

    if (data.expires_in) setupAutoRefresh(data.expires_in);
  } catch (err) {
    console.error("Errore refreshToken:", err);
  }
}

// Timer per refresh automatico prima della scadenza
function setupAutoRefresh(expiresIn: number) {
  const refreshTime = (expiresIn - 60) * 1000; // 60 sec margine
  setTimeout(() => {
    refreshToken();
  }, refreshTime);
}