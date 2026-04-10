// src/LobbyPage.tsx
// solo per testare per ora, poi sarà una pagina a sé stante raggiungibile dopo la creazione o join di una stanza
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLobby } from './hooks/useLobby';
import { fetchLyrics } from './spotify.service';
import type { SpotifyUser } from './types/user.types';
import type { LyricsData } from './types/lobby.types';

const LobbyPage = ({ user }: { user: SpotifyUser | null }) => {
  const { roomId } = useParams<{ roomId: string }>();
  const { room, error } = useLobby();
  
  // 1. Stati per gestire i testi
  const [lyricsData, setLyricsData] = useState<LyricsData[]>([]);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(true);
  const [lyricsError, setLyricsError] = useState<string | null>(null);


  // 2. UseEffect per fare la chiamata API al mount del componente
  useEffect(() => {
    const loadLyrics = async () => {
      try {
        setIsLoadingLyrics(true);
        const data = await fetchLyrics();
        
        // Se il backend risponde con success: true, salviamo l'array
        if (data && data.success) {
          setLyricsData(data.lyrics);
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Errore nel frontend:", error);
        setLyricsError(error.message);
      } finally {
        setIsLoadingLyrics(false);
      }
    };

  
    loadLyrics();
  }, []); 

  return (
    <div className="min-h-screen bg-[#020203] text-white p-10 flex flex-col items-center">
      <div className="max-w-2xl w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
        <h1 className="text-brand text-3xl font-black mb-2 uppercase tracking-tighter italic">
          Stanza: {roomId}
        </h1>
        
        <button className="text-sm text-white/40 mb-6">
          Stato Testi: {isLoadingLyrics ? "Caricamento..." : (lyricsError ? "Errore" : "Recuperati con successo!")}
        </button>
        
        {error && (
          <p className="bg-red-500/10 text-red-500 p-3 rounded-lg border border-red-500/20 mb-4">
            {error}
          </p>
        )}

        <div className="space-y-4 mb-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
            Giocatori nella lobby 
           {user?.display_name === room?.players.find(p => p.isHost)?.displayName && ' (Sei l\'host)'}
          </h2>
          {room?.players.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="font-bold uppercase tracking-tight">{p.displayName}</span>
              <div className="flex gap-2">
                {p.isHost && (
                  <span className="text-[8px] bg-brand text-black px-2 py-1 rounded-full font-black uppercase">
                    Host
                  </span>
                )}
                <span className={`text-[8px] px-2 py-1 rounded-full font-black uppercase ${p.isReady ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/40'}`}>
                  {p.isReady ? 'Pronto' : 'In attesa'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* SEZIONE DI TEST PER VISUALIZZARE I TESTI */}
        <div className="space-y-4 pt-6 border-t border-white/10">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
            Tracce recuperate dal DB
          </h2>
          
          {lyricsError && (
             <p className="text-sm text-red-500">{lyricsError}</p>
          )}

          {isLoadingLyrics ? (
            <div className="text-sm text-white/40 animate-pulse">Caricamento tracce in corso...</div>
          ) : (
            lyricsData.map((brano, index) => (
              <div key={index} className="flex flex-col bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="font-bold uppercase tracking-tight text-brand">{brano.track}</span>
                <span className="text-sm text-white/60 mb-2">{brano.artist}</span>
                <p className="text-xs text-white/40 font-mono bg-black/20 p-2 rounded">{brano.chorus}</p>
                <p className="text-xs text-white/20 italic mt-2">{brano.timestamp ? `Testo sincronizzato disponibile (${brano.timestamp} tempo)` : "Testo sincronizzato non disponibile"}</p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default LobbyPage;