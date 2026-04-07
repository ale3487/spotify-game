// src/LobbyPage.tsx
// solo per testare per ora, poi sarà una pagina a sé stante raggiungibile dopo la creazione o join di una stanza
import { useParams } from 'react-router-dom';
import { useLobby } from './hooks/useLobby';
import type { SpotifyUser } from './types/user.types';

const LobbyPage = ({ user }: { user: SpotifyUser | null }) => {
  const { roomId } = useParams<{ roomId: string }>();
  const { room, error } = useLobby();


  return (
    <div className="min-h-screen bg-[#020203] text-white p-10 flex flex-col items-center">
      <div className="max-w-2xl w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
        <h1 className="text-brand text-3xl font-black mb-2 uppercase tracking-tighter italic">
          Stanza: {roomId}
        </h1>
        
        {error && (
          <p className="bg-red-500/10 text-red-500 p-3 rounded-lg border border-red-500/20 mb-4">
            {error}
          </p>
        )}

        <div className="space-y-4">
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
      </div>
    </div>
  );
};

export default LobbyPage;