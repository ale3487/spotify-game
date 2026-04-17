/**
 * @file Game.tsx
 * @description Componente principale per la fase di gioco attivo.
 * Gestisce il flusso di round, il playback sincronizzato, le risposte dei giocatori e i risultati.
 * Si connette al server via Socket.io per ricevere comandi di gioco e inviare risposte.
 * Utilizza Spotify Web Playback SDK per il controllo del player e sincronizzazione precisa.
 * Mostra interfaccia dinamica con metadati della traccia, opzioni di risposta, feedback immediato e classifica aggiornata.
 * Al termine della partita, visualizza il podio finale con i risultati dei giocatori.
 * Momentaneaamente ha una sola domanda per round, ma è strutturato per supportare facilmente più domande o formati diversi in futuro.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSpotify } from './hooks/useSpotify';
import { socketService } from './service/socket.service';
import { MouseTracker } from './components/MouseTracker';
import { NeonBackground } from './components/NeonBackground';
import { Logo } from './components/Logo';
import type { SpotifyUser } from './types/user.types';
import type { GameCommand, RoundResults, Feedback } from './types/game.types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

const avatarStyles: Record<number, string> = {
  1: 'text-brand bg-brand/10 border-brand/20',
  2: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  3: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  4: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
  5: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
};

/**
 * Componente Game.
 * Gestisce la logica di gioco per un singolo round, inclusi playback, risposte e risultati.
 * Sincronizza il player Spotify con i comandi del server via Socket.io.
 *
 * @param user - Utente autenticato o null
 * @returns Componente React per la fase di gioco
 */

const Game = ({ user }: { user: SpotifyUser | null }) => {
  const { roomId } = useParams<{ roomId: string }>();
  const { deviceId, player } = useSpotify();
  const [gameState, setGameState] = useState<'WAITING' | 'VOTING' | 'RESULTS' | 'FINAL_RESULTS'>('WAITING');
  const [currentTrack, setCurrentTrack] = useState<{name: string, artist: string, image: string} | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [roundResults, setRoundResults] = useState<RoundResults | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [roundCounter, setRoundCounter] = useState(1);
  const finalRankings = roundResults?.rankings || [];
  const podiumPlayers = [finalRankings[1], finalRankings[0], finalRankings[2]];
  const logicLockRef = useRef<string | null>(null);

  /**
   * Converte un timestamp da formato MM:SS a millisecondi.
   * @param ts - Timestamp in formato "MM:SS" o numero di millisecondi
   * @returns Numero di millisecondi
   */
  const parseTimestamp = (ts: string | number): number => {
    if (typeof ts === 'number') return ts;
    const [minutes, seconds] = ts.split(':').map(parseFloat);
    return ((minutes || 0) * 60 + (seconds || 0)) * 1000;
  };

  /**
   * Gestisce la risposta del giocatore a una domanda.
   * Invia la risposta al server via Socket.io e marca il giocatore come "ha risposto".
   * @param name - Nome dell'opzione selezionata
   */
  const handleAnswer = (name: string) => {
    if (hasAnswered || gameState !== 'VOTING') return;
    setHasAnswered(true);
    socketService.socket?.emit('submit_answer', { roomId, answer: name });
  };

  /**
   * Esegue il playback di una traccia Spotify con sincronizzazione precisa.
   * Aggiorna i metadati dell'interfaccia e posiziona il player al timestamp specificato.
   * @param command - Comando di gioco con URI traccia, timestamp e metadati
   * @param playNow - Se avviare immediatamente il playback (default: true)
   */
  const executePlayback = useCallback(async (command: GameCommand, playNow: boolean = true) => {
    if (command.trackName || command.artist || command.image) {
      setCurrentTrack({
        name: command.trackName || '...',
        artist: command.artist || '...',
        image: command.image || ''
      });
    }
    
    if (command.options && command.options.length > 0) {
      setOptions(command.options);
    }

    if (!deviceId || !player) return;

    try {
      logicLockRef.current = command.trackUri;
      const positionMs = parseTimestamp(command.timestamp);
      const tokenRes = await fetch(`${BACKEND_URL}/api/spotify/access_token`, { credentials: 'include' });
      const { accessToken }: { accessToken: string } = await tokenRes.json();

      if (!playNow) {
        await player.setVolume(0);
      }
      const playUrl = `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`;
      
      await fetch(playUrl, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ 
          uris: [command.trackUri],  
          position_ms: Math.floor(positionMs)
        }),
      });

      if (!playNow) {
        await player.pause();
        await player.setVolume(0);
        return;
      }

      if (roundCounter === 1) {
        await player.pause();
        await player.setVolume(0);

        setTimeout(async () => {
          await player.setVolume(0.6);
          await player.resume();
          setGameState('VOTING');
          setHasAnswered(false);
          setFeedback(null);
        }, 4000);
        return;
      }

      setGameState('VOTING');
      setHasAnswered(false);
      setFeedback(null);
    } catch (err) {
      console.error("Errore Playback:", err);
    }
  }, [deviceId, player, roundCounter]);

  /**
   * Riprende il playback della traccia corrente con gestione speciale per il primo round.
   * Nel primo round, aspetta 4 secondi prima di alzare il volume e avviare.
   */
  const resumePlayback = useCallback(async () => {
    if (!player) return;
    try {
      // Alziamo il volume solo dopo l'attesa se siamo al round 1
      const delay = roundCounter === 1 ? 4000 : 0;
      
      if (roundCounter === 1) {
        await player.setVolume(0);
      } else {
        await player.setVolume(0.6);
        await player.resume();
      }

      setTimeout(async () => {
        if (roundCounter === 1) {
            await player.setVolume(0.6);
            await player.resume();
        }
        setGameState('VOTING');
        setHasAnswered(false);
        setFeedback(null);
      }, delay);
    } catch (err) {
      console.error("Errore Resume:", err);
    }
  }, [player, roundCounter]);

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket || !roomId) return;

    const onPrepare = (data: GameCommand) => {
      setGameState('WAITING');
      executePlayback(data, false);
    };

    const onStart = () => resumePlayback();
    const onSeek = (data: GameCommand) => executePlayback(data, true);
    
    const onFeedback = (data: { isCorrect: boolean, pointsGained: number }) => {
      setFeedback({ isCorrect: data.isCorrect, points: data.pointsGained });
    };

    const onResults = (data: RoundResults) => {
      setGameState('RESULTS');
      setRoundResults(data);
      setRoundCounter(prev => data.rankings.length > 0 ? prev + 1 : prev);
      logicLockRef.current = null;
    };

    const onGameOver = (data: RoundResults | { message: string }) => {
      setGameState('FINAL_RESULTS');
      if ('rankings' in data && data.rankings?.length > 0) {
        setRoundResults(data);
      }
    };

    socket.on('game_prepare_next', onPrepare);
    socket.on('game_start_audio', onStart);
    socket.on('game_command_seek', onSeek);
    socket.on('answer_feedback', onFeedback);
    socket.on('game_round_results', onResults);
    socket.on('game_over', onGameOver);

    return () => {
      socket.off('game_prepare_next');
      socket.off('game_start_audio');
      socket.off('game_command_seek');
      socket.off('answer_feedback');
      socket.off('game_round_results');
      socket.off('game_over');
    };
  }, [roomId, executePlayback, resumePlayback]);

 return (
  <div className="h-screen bg-brand-dark text-white flex flex-col items-center p-6 font-sans overflow-hidden relative">
    <NeonBackground />
    <MouseTracker />

    {/* HEADER */}
    <header className="w-full max-w-6xl p-8 flex justify-between items-center z-20">
      <Logo size="md" />
      <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl backdrop-blur-xl flex flex-col items-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 text-center">
          {gameState === 'FINAL_RESULTS' ? `CLASSIFICA FINALE` : `ROUND ${roundCounter} / 10`}
        </p>
        <p className="text-xl font-black text-brand tracking-widest text-center" style={{ filter: 'url(#neon-glow)' }}></p>
      </div>
    </header>

    <main className="w-full max-w-[1400px] flex flex-row gap-12 items-stretch justify-center z-10 flex-1 overflow-hidden px-8">
      
      {/* SIDEBAR RANKING */}
      {gameState !== 'FINAL_RESULTS' && (
        <aside className="w-48 shrink-0 flex flex-col items-center justify-center gap-6 py-4 animate-in fade-in slide-in-from-left-10 duration-700">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 italic text-center mb-2">Classifica</h2>
          <div className="flex flex-col gap-8 w-full items-center">
            {(roundResults?.rankings || []).map((p, i) => {
              const spotifyImg = p.imageUrl || (p.displayName === user?.display_name ? user?.images?.[0]?.url : null);
              const styleClass = avatarStyles[p.defaultAvatarId as keyof typeof avatarStyles] || avatarStyles[1];
              const isMe = p.displayName === user?.display_name;
              const isLeader = i === 0;

              return (
                <div key={p.displayName} className="flex flex-col items-center animate-avatar-vibe shrink-0 relative">
                  <div className="relative">
                    {/* Bordo colorato solo se isMe è true */}
                    <div className={`relative w-20 h-20 rounded-full border-[4px] p-1 transition-all duration-700 ${isMe ? 'border-brand shadow-[0_0_25px_rgba(199,154,0,0.3)] scale-105' : 'border-white/10 bg-white/5'}`}>
                      {spotifyImg ? (
                        <img src={spotifyImg} alt={p.displayName} className="w-full h-full rounded-full object-cover bg-neutral-900" />
                      ) : (
                        <div className={`w-full h-full rounded-full flex items-center justify-center text-xl font-black border uppercase ${styleClass}`}>
                          {p.displayName.charAt(0)}
                        </div>
                      )}
                      
                      {/* Sticker LEADER (legato alla posizione i === 0) */}
                      {isLeader && (
                        <div className="absolute -top-2 -left-3 bg-white text-black text-[8px] font-black px-2 py-0.5 rounded-md uppercase shadow-xl rotate-[-10deg] z-20">
                          Leader
                        </div>
                      )}

                      <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-[3px] border-brand-dark flex items-center justify-center z-20 bg-brand text-black font-black text-[10px] italic shadow-lg`}>
                        {p.score}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <h3 className={`font-black uppercase tracking-tight text-[10px] italic truncate max-w-[100px] ${isMe ? 'text-brand' : 'text-white/90'}`}>
                      {p.displayName}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* AREA GIOCO / PODIO */}
      <section className={`flex-1 max-w-4xl flex items-center justify-center rounded-[3.5rem] relative px-12 transition-all duration-500 ${gameState === 'FINAL_RESULTS' ? 'bg-transparent border-none backdrop-blur-none shadow-none' : 'bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl overflow-hidden'}`}>
        
        {gameState === 'VOTING' && (
          <div className="flex flex-col md:flex-row items-center gap-14 w-full animate-in fade-in zoom-in">
            <div className="relative shrink-0">
              <div className="absolute -inset-8 bg-brand/20 rounded-full blur-3xl opacity-20"></div>
              <img src={currentTrack?.image || '/placeholder.png'} className="w-48 h-48 md:w-56 md:h-56 rounded-[2.5rem] object-cover shadow-2xl border border-white/10 relative z-10" alt="Cover" />
            </div>
            <div className="flex-1 text-left space-y-6 w-full max-w-md">
              <div>
                <h1 className="text-3xl md:text-4xl font-black uppercase italic leading-none tracking-tighter mb-2">{currentTrack?.name}</h1>
                <p className="text-xl font-black uppercase tracking-[0.2em] text-brand italic opacity-90">{currentTrack?.artist}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 w-full">
                {options.map((name) => (
                  <button key={name} onClick={() => handleAnswer(name)} disabled={hasAnswered} className={`py-4 px-6 rounded-2xl font-bold uppercase border transition-all text-left text-xs ${hasAnswered ? 'opacity-30 border-white/5' : 'bg-white/5 border-white/10 hover:border-brand hover:translate-x-3 hover:bg-brand/5'}`}>
                    {name}
                  </button>
                ))}
              </div>
              {hasAnswered && feedback && (
                <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
                  <p className={`font-black uppercase italic text-[10px] tracking-[0.3em] ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {feedback.isCorrect ? `✓ RISPOSTA ESATTA! +${feedback.points} PT` : 'X SBAGLIATO, RIPROVA AL PROSSIMO'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {(gameState === 'WAITING' || gameState === 'RESULTS') && (
          <div className="text-center p-8 animate-in fade-in max-w-xl">
            <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-8 tracking-tighter leading-tight">
              "Qualcuno ha ascoltato questa canzone per molto tempo, <span className="text-brand">chi?</span>"
            </h2>
            <div className="w-56 h-1.5 bg-white/10 mx-auto rounded-full overflow-hidden">
              <div className="h-full bg-brand animate-[pulse_2s_infinite] w-full" />
            </div>
          </div>
        )}

        {/* PODIO FINALE */}
        {gameState === 'FINAL_RESULTS' && (
          <div className="animate-in zoom-in duration-700 flex flex-col items-center w-full px-4 overflow-visible">
            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-16">SESSION RESULTS</h1>
            
            <div className="flex flex-row items-end justify-center gap-4 md:gap-12 w-full max-w-3xl h-[320px]">
              {podiumPlayers.map((p, visualIndex) => {
                if (!p) return null;
                const isFirst = visualIndex === 1;   
                const isSecond = visualIndex === 0;  
                const isThird = visualIndex === 2;   
                const spotifyImg = p.imageUrl || (p.displayName === user?.display_name ? user?.images?.[0]?.url : null);
                const styleClass = avatarStyles[p.defaultAvatarId as keyof typeof avatarStyles] || avatarStyles[1];

                let medalColor = "bg-brand"; 
                let borderColor = "border-brand";
                let sizeClass = "w-40 h-40 border-[8px] scale-125 z-20"; 
                let shadow = "shadow-[0_0_50px_rgba(255,174,0,0.3)]";
                let rankLabel = "1st";

                if (isSecond) {
                  medalColor = "bg-slate-300"; rankLabel = "2nd";
                  borderColor = "border-slate-300"; sizeClass = "w-32 h-32 border-[5px] scale-100 z-10";
                  shadow = "shadow-[0_0_30px_rgba(200,200,200,0.2)]";
                } else if (isThird) {
                  medalColor = "bg-[#CD7F32]"; rankLabel = "3rd";
                  borderColor = "border-[#CD7F32]"; sizeClass = "w-24 h-24 border-[4px] scale-85 z-0";
                  shadow = "shadow-[0_0_20px_rgba(205,127,50,0.15)]";
                }

                return (
                  <div key={p.displayName} className={`flex flex-col items-center transition-all duration-1000 ${!isFirst && 'opacity-80'}`}>
                    <div className="relative">
                      <div className={`${sizeClass} rounded-full overflow-hidden transition-all ${borderColor} ${shadow}`}>
                        {spotifyImg ? (
                          <img src={spotifyImg} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-3xl font-black ${styleClass}`}>{p.displayName[0]}</div>
                        )}
                      </div>
                      <div className={`absolute -top-3 -right-2 ${medalColor} text-black font-black px-3 py-1 rounded-lg shadow-2xl rotate-[12deg] z-30 text-sm border-2 border-black/10`}>
                        {rankLabel}
                      </div>
                    </div>
                    <div className={`mt-8 text-center ${isFirst ? 'mb-4' : ''}`}>
                      <span className={`font-black uppercase italic block truncate ${isFirst ? 'text-2xl text-brand w-40' : 'text-sm text-white/80 w-28'}`}>
                        {p.displayName}
                      </span>
                      <span className={`font-black text-white/40 tracking-widest uppercase ${isFirst ? 'text-sm' : 'text-[10px]'}`}>
                        {p.score} PTS
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => window.location.href = '/dashboard'} 
              className="mt-16 px-12 py-4 bg-brand text-black font-black uppercase italic rounded-full hover:scale-110 hover:shadow-brand transition-all text-sm shadow-lg z-50"
            >
              Torna alla Dashboard
            </button>
          </div>
        )}
      </section>
    </main>
  </div>
  );
}

export default Game;