import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { loginSpotify, exchangeToken } from "./login";


function Spotify() {
  return <button onClick={loginSpotify}>Login con Spotify</button>;
}


function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handle() {
      await exchangeToken();
      // una volta che il token è salvato, vai su Game
      
      navigate("/game");
    }
    handle();
  }, []);

  return <h1>Caricamento Spotify...</h1>;
}

function Game() {
  const [profile, setProfile] = useState<{ display_name: string; email: string } | null>(null);

  useEffect(() => {
    const access_token = localStorage.getItem("access_token");
    if (!access_token) return;

    fetch("http://127.0.0.1:5000/api/spotify/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token }),
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setProfile(data);
      })
      .catch(err => console.error("Errore fetch profilo:", err));
  }, []);

  if (!profile) return <h1>Caricamento profilo...</h1>;

  return (
    <div>
      <h1>Benvenuto, {profile.display_name}!</h1>
      <p>Email: {profile.email}</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Spotify />} />
      <Route path="/callback" element={<Callback />} />
      <Route path="/game" element={<Game />} />
    </Routes>
  );
}

export default App;