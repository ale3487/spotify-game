import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLobby } from './hooks/useLobby';
import { fetchLyrics } from './service/spotify.service';
import { socketService } from './service/socket.service';

// Componenti Brand
import { Logo } from './components/Logo';
import { NeonBackground } from './components/NeonBackground';
import { MouseTracker } from './components/MouseTracker';
import SpotifyPlayer from './components/SpotifyPlayer';
import type { SpotifyUser } from './types/user.types';

const avatarStyles: Record<number, string> = {
  1: 'text-brand bg-brand/10 border-brand/20',
  2: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  3: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  4: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
  5: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
};

const LobbyPage = ({ user }: { user: SpotifyUser | null }) => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { room, error: lobbyError, setReady, startGame, joinRoom } = useLobby();
  
  // Stati per Spotify
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);

  // Lock per evitare bombardamento API Lyrics
  const syncLock = useRef<'IDLE' | 'FETCHING' | 'SUCCESS'>('IDLE');

  // --- LOGICA DI USCITA PULITA ---
  const handleLeave = () => {
    // 1. Notifica il server
    socketService.socket?.emit('leave_room', roomId);
    
    // 2. Resetta il lock locale
    syncLock.current = 'IDLE';
    
    // 3. Forza un refresh dello stato se necessario (opzionale)
    window.location.href = '/dashboard'; // Soluzione estrema se navigate fallisce
  };

  // 1. Join nella stanza
  useEffect(() => {
    if (!room && roomId && user) {
      joinRoom(roomId, user);
    }
  }, [roomId, user, joinRoom, room]);

  // 2. Sync Lyrics
  useEffect(() => {
    const meInRoom = room?.players.find(p => p.id === socketService.socket?.id);

    if (room && meInRoom && !meInRoom.isReady && syncLock.current === 'IDLE') {
      const startSync = async () => {
        syncLock.current = 'FETCHING';
        try {
          const res = await fetchLyrics();
          if (res?.success) {
            syncLock.current = 'SUCCESS';
            setReady(roomId!); 
          } else { 
            syncLock.current = 'IDLE'; 
          }
        } catch { 
          syncLock.current = 'IDLE';
        }
      };
      startSync();
    }
  }, [room, roomId, setReady]);

  // 3. Navigazione al Game
  useEffect(() => {
    let isMounted = true;

    if (room?.status === 'PLAYING' && isMounted) {
      navigate(`/game/${roomId}`);
    }

    return () => { isMounted = false; };
  }, [room?.status, navigate, roomId]);

  // Logica Bottoni e UI
  const me = room?.players.find(p => p.id === socketService.socket?.id);
  const isHost = me?.isHost;
  
  const canStart = (room?.players?.length ?? 0) >= 2 && 
                   room?.players.every(p => p.isReady) && 
                   isPlayerReady;

  const delays = useMemo(() => [0, -1.5, -3.2, -0.8, -4.5], []);

  const handleStartGame = () => {
    if (roomId && canStart) {
      console.log(`🚀 Avvio match sul device: ${activeDeviceId}`);
      startGame(roomId);
    }
  };

  useEffect(() => {
  return () => {
    // Quando l'utente lascia la pagina (smontaggio)
    console.log("Smontaggio Lobby: invio leave_room");
    socketService.socket?.emit('leave_room', roomId);
    // Opzionale: se il tuo socketService ha una funzione per resettare lo stato
    // socketService.reset(); 
  };
}, [roomId]);

  return (
    <div className="min-h-screen bg-brand-dark text-white relative flex flex-col items-center overflow-hidden font-sans">
      
      {/* Spotify Player caricato subito */}
      <SpotifyPlayer onPlayerReady={(id) => {
        setActiveDeviceId(id);
        setIsPlayerReady(true);
      }} />

      <NeonBackground />
      <MouseTracker />

      {/* HEADER */}
      <header className="w-full max-w-6xl p-8 flex justify-between items-center z-20">
        <Logo size="md" />
        <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl backdrop-blur-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Room ID</p>
          <p className="text-xl font-black text-brand tracking-widest">{roomId}</p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-6xl px-6 py-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4">
            Lobby <span className="text-brand text-glow">Vibes</span>
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-brand/10 border border-brand/20 rounded-full">
             <div className={`w-2 h-2 rounded-full ${isPlayerReady ? 'bg-brand animate-pulse' : 'bg-red-500'}`} />
             <p className="text-brand font-black uppercase tracking-widest text-[9px]">
               {room?.players.length || 0} / 5 Players
             </p>
          </div>
        </div>

        {/* PLAYER GRID */}
        <div className="flex flex-wrap justify-center gap-10 md:gap-14 mb-20">
          {room?.players.map((p, i) => {
            const spotifyImg = p.avatarUrl || (p.displayName === user?.display_name ? user?.images?.[0]?.url : null);
            const styleClass = avatarStyles[p.defaultAvatarId as keyof typeof avatarStyles] || avatarStyles[1];

            return (
              <div 
                key={p.id} 
                className="flex flex-col items-center animate-avatar-vibe"
                style={{ animationDelay: `${delays[i]}s` }}
              >
                <div className="relative">
                  <div className={`relative w-32 h-32 md:w-36 md:h-36 rounded-full border-[6px] p-1.5 transition-all duration-700 ${p.isReady ? 'border-brand shadow-[0_0_30px_rgba(199,154,0,0.3)]' : 'border-white/10 bg-white/5'}`}>
                    {spotifyImg ? (
                      <img src={spotifyImg} alt={p.displayName} className="w-full h-full rounded-full object-cover bg-neutral-900" />
                    ) : (
                      <div className={`w-full h-full rounded-full flex items-center justify-center text-4xl font-black border uppercase ${styleClass}`}>
                        {p.displayName.charAt(0)}
                      </div>
                    )}
                    
                    {p.isHost && (
                      <div className="absolute -top-1 -left-2 bg-white text-black text-[9px] font-black px-2.5 py-1 rounded-lg uppercase shadow-xl rotate-[-10deg] z-20">Host</div>
                    )}

                    <div className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full border-[5px] border-brand-dark flex items-center justify-center z-20 ${p.isReady ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-orange-500'}`}>
                      {p.isReady ? (
                        <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={6}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      ) : (
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-5 text-center px-4">
                  <h3 className="font-black uppercase tracking-tight text-lg italic truncate max-w-[140px]">{p.displayName}</h3>
                  <p className={`text-[9px] font-black uppercase tracking-[0.3em] mt-2 ${p.isReady ? 'text-brand' : 'text-orange-400 animate-pulse'}`}>
                    {p.isReady ? 'Ready' : 'Syncing...'}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Slot vuoti per mantenere il layout pulito */}
          {Array.from({ length: 5 - (room?.players.length || 0) }).map((_, i) => (
            <div key={`empty-${i}`} className="w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-dashed border-white/5 flex items-center justify-center opacity-10">
              <span className="text-3xl font-thin text-white">+</span>
            </div>
          ))}
        </div>

        {/* ACTION AREA - TASTI AFFIANCATI */}
        <div className="w-full max-w-md flex gap-4">
          
          <button
            onClick={handleLeave}
            className="flex-none w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/40 group transition-all duration-300"
            title="Esci dalla Lobby"
          >
            <svg className="w-6 h-6 text-white/20 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="flex-1">
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={!canStart}
                className={`w-full h-16 rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] transition-all duration-500 ${
                  canStart 
                    ? 'bg-brand text-black shadow-[0_0_30px_rgba(199,154,0,0.3)] hover:scale-[1.02]' 
                    : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'
                }`}
              >
                {!isPlayerReady ? 'Spotify Connecting...' : canStart ? 'Start Match' : 'Waiting for Players'}
              </button>
            ) : (
              <div className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center px-6">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 italic text-center leading-tight">
                  {!isPlayerReady ? "Spotify Syncing..." : me?.isReady ? "Ready to Play" : "Fetching Lyrics..."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FEEDBACK ERRORI */}
      {lobbyError && (
        <div className="fixed bottom-10 bg-red-600/90 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest z-50 shadow-2xl animate-bounce">
          {lobbyError}
        </div>
      )}
    </div>
  );
};

export default LobbyPage;