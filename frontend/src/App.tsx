import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { exchangeToken, checkSession } from "./spotify.service";
import Home from './home';
import Statistics from './Statistics';

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

/**
 * Componente per la gestione della Callback di OAuth2.
 * Recupera il codice dall'URL, effettua lo scambio dei token e reindirizza l'utente.
 * * @param props - Proprietà del componente.
 * @param props.onLogin - Callback per aggiornare lo stato dell'utente nel componente root.
 */
function Callback({ onLogin }: { onLogin: (u: SpotifyUser) => void }) {
  const navigate = useNavigate();
  /** Ref per prevenire doppie chiamate causate dal React.StrictMode in sviluppo */
  const hasCalled = useRef(false);

  useEffect(() => {
    async function handle() {
      if (hasCalled.current) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (!code) return;

      hasCalled.current = true;
      try {
        const data = await exchangeToken();
        if (data && data.spotifyId) {
          onLogin(data as SpotifyUser);
          navigate("/statistics");
        }
      } catch (err) {
        console.error("Login fallito", err);
        navigate("/");
      }
    }
    handle();
  }, [navigate, onLogin]);

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="animate-pulse text-brand font-black tracking-widest uppercase">
          Sincronizzazione Spotify...
        </div>
    </div>
  );
}

/**
 * Componente di transizione che visualizza il profilo utente e l'avatar.
 * Agisce come una "Dashboard" rapida prima di accedere alle statistiche.
 * * @param props - Proprietà del componente.
 * @param props.user - L'oggetto utente corrente o null se non autenticato.
 */
function Game({ user }: { user: SpotifyUser | null }) {
  const navigate = useNavigate();

  // Protezione della rotta: se l'utente non esiste, torna in home
  if (!user) return <Navigate to="/" />;

  /**
   * Determina l'ID dell'avatar da visualizzare.
   * Se non fornito dal backend, lo genera deterministicamente basandosi sullo spotifyId.
   * @returns {number} Un intero tra 1 e 5.
   */
  const getAvatarId = () => {
    if (user.defaultAvatarId) return user.defaultAvatarId;
    const charCodeSum = user.spotifyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (charCodeSum % 5) + 1;
  };

  const avatarId = getAvatarId();

  /** Mappatura degli stili grafici in base all'ID avatar */
  const avatarStyles: Record<number, string> = {
    1: 'text-brand bg-brand/10 border-brand/20',
    2: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    3: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    4: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    5: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white p-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[40px] p-10 text-center shadow-2xl">
        <div className="mb-8 flex justify-center">
          {user.images && user.images.length > 0 ? (
            <img src={user.images[0].url} alt="Profile" className="w-32 h-32 rounded-full border-2 border-brand object-cover shadow-[0_0_30px_rgba(199,154,0,0.3)]" />
          ) : (
            <div className={`w-32 h-32 rounded-full border-2 flex items-center justify-center shadow-lg ${avatarStyles[avatarId]}`}>
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
            </div>
          )}
        </div>
        <h1 className="text-3xl font-black tracking-tighter mb-2 uppercase italic">{user.display_name}</h1>
        <div className="space-y-1 mb-10 opacity-40">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]">ID: {user.spotifyId}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]">{user.email}</p>
        </div>
        <button 
          onClick={() => navigate("/statistics")}
          className="w-full bg-brand hover:bg-brand-hover text-brand-dark font-black py-4 rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-xl uppercase text-xs tracking-widest"
        >
          Analizza Statistiche
        </button>
      </div>
    </div>
  );
}

/**
 * Componente Root dell'applicazione.
 * Gestisce la persistenza della sessione al caricamento e definisce l'alberatura delle rotte.
 */
export default function App() {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Effetto di inizializzazione: verifica se esiste una sessione attiva (cookie/token)
   * al primo rendering della pagina.
   */
  useEffect(() => {
    async function initAuth() {
      try {
        const userData = await checkSession();
        if (userData && userData.spotifyId) {
          setUser(userData as SpotifyUser);
        }
      } catch (err) {
        console.error("Sessione non valida o scaduta", err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  // Visualizzazione di uno spinner durante il controllo della sessione
  if (loading) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/callback" element={<Callback onLogin={setUser} />} />
      <Route path="/game" element={<Game user={user} />} />
      <Route path="/statistics" element={<Statistics user={user} />} />
    </Routes>
  );
}