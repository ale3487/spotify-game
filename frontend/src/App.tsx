import { Routes, Route, useNavigate, Navigate} from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { loginSpotify, exchangeToken, checkSession, fetchTopUser } from "./login";


// 1. Definiamo l'interfaccia precisa per l'utente
interface SpotifyUser {
  spotifyId: string;
  display_name: string;
  email: string;
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
  const navigate = useNavigate(); // Usa l'hook per navigare

  if (!user) return <Navigate to="/" />;

  return (
    <div>
      <h1>Benvenuto, {user.display_name}!</h1>
      <p>Spotify ID: {user.spotifyId}</p>
      <p>Email: {user.email}</p>
      <button onClick={() => navigate("/statistics")}>Statistica</button>
    </div>
  );
}

function Spotify() {
  return <button onClick={loginSpotify}>Login con Spotify</button>;
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
  }, [type, range]); // Si ricarica ogni volta che cambi tipo o periodo!

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
      <Route path="/" element={<Spotify />} />
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