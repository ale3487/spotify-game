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
  const [user] = useState(() => ({
    spotify_id: localStorage.getItem("spotify_id") || undefined,
    display_name: localStorage.getItem("display_name") || undefined,
    email: localStorage.getItem("email") || undefined,
  }));

  if (!user.spotify_id) return <p>Caricamento...</p>;

  return (
    <div>
      <h1>Benvenuto, {user.display_name}!</h1>
      <p>Spotify ID: {user.spotify_id}</p>
      <p>Email: {user.email}</p>
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