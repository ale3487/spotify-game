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

  const codeVerifier = localStorage.getItem("code_verifier");
  if (!codeVerifier) return console.error("Code verifier non trovato");
 // Fai la richiesta al backend per scambiare code con token
  try {
    console.log("Sto facendo la richiesta token...");
    console.log("BACKEND_URL:", BACKEND_URL);
    const res = await fetch(`${BACKEND_URL}/api/spotify/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, code_verifier: codeVerifier }),
    });

    const data = await res.json();
    if (data.error) return console.error("Errore ottenendo il token:", data);

    localStorage.setItem("spotify_id", data.user.id);
    localStorage.setItem("display_name", data.user.username);
    localStorage.setItem("email", data.user.email);

    console.log("Id: " + data.user.id);
    return;

  } catch (err) {
    console.error("Errore exchangeToken:", err);
  }
}
