/**
 * @file LobbyPage.tsx
 * @description Gestione della lobby prima dell'inizio del gioco: mostra i giocatori, il loro stato di "ready", e permette all'host di avviare la partita.
 * - Sincronizzazione dei testi: quando un giocatore entra, se non è "ready", viene avviata la sincronizzazione dei testi. Solo al completamento di questa operazione il giocatore viene segnato come "ready".
 * - Gestione uscita: se un giocatore decide di uscire dalla lobby, blocchiamo ogni operazione in corso (join, sync) e navighiamo pulitamente alla dashboard. Questo previene qualsiasi problema di stato o socket "appesi" che potrebbero verificarsi se un giocatore lascia durante la sincronizzazione o subito dopo il join.
 * - UI dinamica: mostra lo stato di ogni giocatore (host, ready, sincronizzazione) con avatar, nome e indicatori visivi. Il pulsante "Avvia Partita" è abilitato solo quando tutti i giocatori sono pronti.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLobby } from './hooks/useLobby';
import { fetchLyrics } from './service/spotify.service';
import { socketService } from './service/socket.service';

// Componenti UI
import { Logo } from './components/Logo';
import { NeonBackground } from './components/NeonBackground';
import { MouseTracker } from './components/MouseTracker';
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
  
  const { room, error: lobbyError, setReady, startGame, joinRoom, leaveRoom } = useLobby();
  const hasAttemptedJoin = useRef(false);
  
  const syncLock = useRef<'IDLE' | 'FETCHING' | 'SUCCESS'>('IDLE');
  
  // Questo Ref è fondamentale: blocca ogni tentativo di join se l'utente ha cliccato "Esci"per evitare che nonostante la navigazione verso la dashboard, si riunisca alla stanza
  const isLeavingRef = useRef(false);

  // Funzione di gestione uscita: blocca ogni operazione in corso e naviga alla dashboard
  const handleLeave = () => {
    if (!roomId) return;
    
    isLeavingRef.current = true; // Blocca istantaneamente gli useEffect locali
    leaveRoom(roomId); 
    syncLock.current = 'IDLE';
    // Navigazione pulita verso la dashboard
    navigate('/dashboard', { replace: true });
  };

  const handleStartGame = () => {
    if (roomId && canStart) {
      startGame(roomId);
    }
  };

  // 1 : gestione join alla stanza
  useEffect(() => {
    // Se stiamo lasciando, abbiamo già bloccato tutto, quindi non facciamo nulla
    if (isLeavingRef.current || hasAttemptedJoin.current || !roomId || !user) {
      return;
    }
    // Se la room c'è già ed è quella corretta, segna come fatto e basta
    if (room && room.roomId === roomId) {
      hasAttemptedJoin.current = true;
      return;
    }
    // Esegue il join e blocca i tentativi successivi
    hasAttemptedJoin.current = true;
    joinRoom(roomId, user);
  }, [roomId, user, joinRoom, room]);

  // 2 : gestione sincronizzazione testi e stato "ready"
  useEffect(() => {
    if (isLeavingRef.current) return;

    const socketId = socketService.socket?.id;
    const meInRoom = room?.players.find(p => p.id === socketId);

    // Se sono in una stanza ma non sono segnato come "Ready", avvio il sync dei testi
    if (room && roomId && meInRoom && !meInRoom.isReady && syncLock.current === 'IDLE') {
      const startSync = async () => {
        syncLock.current = 'FETCHING';
        try {
          const res = await fetchLyrics(roomId);
          if (res?.success && !isLeavingRef.current) {
            syncLock.current = 'SUCCESS';
            setReady(roomId); 
          } else { 
            syncLock.current = 'IDLE'; 
          }
        } catch (err) { 
          console.error("Errore sync lyrics:", err);
          syncLock.current = 'IDLE';
        }
      };
      startSync();
    }
  }, [room, roomId, setReady]);

  // --- 3 : gestione navigazione alla schermata di gioco quando la partita inizia ---
  useEffect(() => {
    if (room?.status === 'PLAYING' && roomId && !isLeavingRef.current) {
      navigate(`/game/${roomId}`);
    }
  }, [room?.status, navigate, roomId]);


  // Dati per UI
  const me = room?.players.find(p => p.id === socketService.socket?.id);
  const isHost = me?.isHost;
  const canStart = (room?.players?.length ?? 0) >= 2 && room?.players.every(p => p.isReady); // La partita può essere avviata solo se ci sono almeno 2 giocatori e tutti sono pronti per debug settato a 1
  const delays = useMemo(() => [0, -1.5, -3.2, -0.8, -4.5], []);

  return (
    <div className="min-h-screen bg-brand-dark text-white relative flex flex-col items-center overflow-hidden font-sans">
      <NeonBackground />
      <MouseTracker />

      {/* Header */}
      <header className="w-full max-w-6xl p-8 flex justify-between items-center z-20">
      <Logo size="md" />
      
      {/* Aggiunto 'flex flex-col items-center' per centrare il contenuto del box */}
      <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl backdrop-blur-xl flex flex-col items-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 text-center">
          ID Stanza
        </p>
        <p 
          className="text-xl font-black text-brand tracking-widest text-center" 
          style={{ filter: 'url(#neon-glow)' }}
        > 
          {roomId}
        </p>
      </div>
      </header>

      {/* Main Lobby */}
      <main className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-6xl px-6 py-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4">
            Lobby  <span  className="text-brand" style={{ filter: 'url(#neon-glow)' }}>Vibes</span>
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-brand/10 border border-brand/20 rounded-full">
             <p className="text-brand font-black uppercase tracking-widest text-[9px]">
               {room?.players.length || 0} / 4 giocatori
             </p>
          </div>
        </div>

        {/* Griglia Avatar */}
        <div className="flex flex-wrap justify-center gap-10 md:gap-14 mb-20">
          {room?.players.map((p, i) => {
            const spotifyImg = p.imageUrl || (p.displayName === user?.display_name ? user?.images?.[0]?.url : null);
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
                    {p.isReady ? 'pronto' : 'Sincronizzazione...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controlli di fondo */}
        <div className="w-full max-w-md flex gap-4">
          <button
            onClick={handleLeave}
            className="flex-none w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/40 group transition-all duration-300"
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
                {canStart ? 'Avvia Partita' : 'In attesa di giocatori...'}
              </button>
            ) : (
              <div className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center px-6">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 italic text-center leading-tight">
                  {me?.isReady ? "Pronto per giocare" : "Recupero testi..."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Error Toast */}
      {lobbyError && (
        <div className="fixed bottom-10 bg-red-600/90 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest z-50 animate-bounce">
          {lobbyError}
        </div>
      )}
    </div>
  );
};

export default LobbyPage;