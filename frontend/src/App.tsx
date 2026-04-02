import { Routes, Route, useNavigate, Navigate} from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { exchangeToken, checkSession, fetchTopUser } from "./login";
import Home from './home';


// 1. Definiamo l'interfaccia precisa per l'utente
interface SpotifyUser {
  spotifyId: string;
  display_name: string;
  email: string;
  images: {url: string }[] | null; // Può essere un array di immagini o null
  defaultAvatarId: number | null; // ID dell'avatar predefinito se non ci sono immagini
}

// 2. Tipizziamo le Props di Callback
interface CallbackProps {
  onLogin: (userData: SpotifyUser) => void;
}

function Callback({ onLogin }: CallbackProps) {
  const navigate = useNavigate();
  // Usiamo un ref per tracciare se abbiamo già inviato il codice
  const hasCalled = useRef(false);

  useEffect(() => {
    async function handle() {
      // Se abbiamo già chiamato o non c'è il code nell'URL, usciamo
      if (hasCalled.current) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get("code")) return;

      hasCalled.current = true; // Segniamo che stiamo procedendo

      try {
        const data = await exchangeToken();
        if (data && data.spotifyId) {
          onLogin(data as SpotifyUser); 
          navigate("/game");
        }
      } catch (err) {
        console.error("Login fallito", err);
        // Evitiamo di navigare via subito in caso di errore di "doppia chiamata"
        // o gestiamo il redirect alla home dopo un delay
      }
    }
    handle();
  }, [navigate, onLogin]);

  return <h1>Caricamento Spotify...</h1>;
}

// 3. Tipizziamo le Props di Game
interface GameProps {
  user: SpotifyUser | null;
}


function Game({ user }: GameProps) {
  const navigate = useNavigate();

  if (!user) return <Navigate to="/" />;

  // 1. LOGICA DETERMINISTICA PER L'AVATAR (Sempre lo stesso colore per lo stesso ID)
  const getAvatarId = () => {
    if (user.defaultAvatarId) return user.defaultAvatarId;
    const charCodeSum = user.spotifyId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return (charCodeSum % 5) + 1;
  };

  const avatarId = getAvatarId();

  // 2. MAPPA COLORI NEON
  const avatarStyles: Record<number, string> = {
    1: 'text-brand bg-brand/10 border-brand/20',
    2: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    3: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    4: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    5: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white p-8 flex flex-col items-center justify-center">
      {/* CARD PROFILO */}
      <div className="max-w-md w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[40px] p-10 text-center shadow-2xl">
        
        {/* SEZIONE AVATAR */}
        <div className="mb-8 flex justify-center">
          {user.images && user.images.length > 0 ? (
            <img 
              src={user.images[0].url} 
              alt="Profile" 
              className="w-32 h-32 rounded-full border-2 border-brand object-cover shadow-[0_0_30px_rgba(199,154,0,0.3)]" 
            />
          ) : (
            <div className={`w-32 h-32 rounded-full border-2 flex items-center justify-center shadow-lg ${avatarStyles[avatarId]}`}>
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>

        {/* INFO UTENTE */}
        <h1 className="text-3xl font-black tracking-tighter mb-2 uppercase italic">
          {user.display_name}
        </h1>
        
        <div className="space-y-1 mb-10">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
            Spotify ID: {user.spotifyId}
          </p>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
            {user.email}
          </p>
        </div>

        {/* AZIONI */}
        <button 
          onClick={() => navigate("/statistics")}
          className="w-full bg-brand hover:bg-brand-hover text-brand-dark font-black py-4 px-8 rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(199,154,0,0.2)] uppercase text-xs tracking-[0.2em]"
        >
          Analizza Statistiche
        </button>
      </div>
      
      {/* Torna alla Home */}
      <button 
        onClick={() => navigate("/")}
        className="mt-8 text-white/20 hover:text-brand text-[10px] font-bold uppercase tracking-widest transition-colors"
      >
        Torna alla Dashboard
      </button>
    </div>
  );
}


function Statistics({ user }: GameProps) {
  const [items, setItems] = useState<string[]>([]);
  const [type, setType] = useState<"artists" | "tracks">("artists");
  const [range, setRange] = useState("medium_term");

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      const response = await fetchTopUser(type, range);
      setItems(response.data || []);
    }
    loadData();
  }, [type, range]); 

  return (
    <div>
      {/* Selettore Tipo */}
      <button onClick={() => setType("artists")}>Top Artisti</button>
      <button onClick={() => setType("tracks")}>Top Brani</button>

      {/* Selettore Periodo */}
      <select onChange={(e) => setRange(e.target.value)} value={range}>
        <option value="short_term">Ultimo mese</option>
        <option value="medium_term">Ultimi 6 mesi</option>
        <option value="long_term">Sempre</option>
      </select>

      <ul>
        {items.map((name, i) => <li key={i}>{name}</li>)}
      </ul>
    </div>
  );
} 




export default function App() {
  // Specifichiamo che lo stato può essere o SpotifyUser o null
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const userData = await checkSession();
        if (userData && userData.spotifyId) {
          setUser(userData as SpotifyUser);
        }
      } catch (err) {
        console.error("Sessione non valida" , err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  if (loading) return <h1>Verifica sessione in corso...</h1>;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route 
        path="/callback" 
        element={<Callback onLogin={(userData: SpotifyUser) => setUser(userData)} />} 
      />
        <Route 
          path="/game" 
          element={<Game user={user} />} 
        />
        <Route 
          path="/statistics" 
          element={<Statistics user={user} />}
        />
    </Routes>
  );
}