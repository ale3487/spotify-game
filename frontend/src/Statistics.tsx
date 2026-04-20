/**
 * @file Statistics.tsx
 * @description Dashboard statistiche con grafica e Player globale, mostra i top artisti o brani dell'utente con stima del tempo di ascolto totale.
 * se artisti mostra nome, immagine e link Spotify, se brani mostra nome, artista, immagine e pulsante play/pausa integrato con Spotify Web Playback SDK.
 * include selettori per tipo (artisti/brani) e range temporale (1 mese, 6 mesi, 1 anno) con stima minuti/ore basata su numero di elementi.
 * utilizza componenti Logo, NeonBackground e MouseTracker per grafica accattivante.
 * se utente non loggato reindirizza alla home.
 * gestisce stato di caricamento e errori durante fetch dati.
 * Gestione offline: mostra badge "Offline" se isOffline è true, disabilita funzionalità di riproduzione e mostra messaggio di avviso.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { fetchTopUser } from "./service/spotify.service";
import { useSpotify } from './hooks/useSpotify';

// --- TIPI ---
import type { 
  StatisticsProps, 
  TrackOrArtist, 
  BackendResponse, 
  RawItem, 
  CachedItem, 
  SpotifyArtistRaw, 
  SpotifyTrackRaw 
} from './types/statistics.types';

// --- COMPONENTI ---
import { Logo } from './components/Logo'; 
import { NeonBackground } from './components/NeonBackground';
import { MouseTracker } from './components/MouseTracker';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

const Statistics = ({ user, isOffline }: StatisticsProps) => {
  const [items, setItems] = useState<TrackOrArtist[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [type, setType] = useState<'artists' | 'tracks'>('artists');
  const [range, setRange] = useState<string>('medium_term');
  const [loading, setLoading] = useState<boolean>(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const { deviceId, player: playerInstance } = useSpotify();
  const navigate = useNavigate();

 useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      
      // Chiave per la cache locale basata su tipo e range
      const cacheKey = `spotify_stats_${type}_${range}`;

      try {
        // 1. Chiamata al backend
        const response: BackendResponse = await fetchTopUser(type, range);
        
        if (response && response.data) {
          const rawItems = response.data;
          
          // 2. Formattazione (Normalizzazione dei dati)
          const formattedData: TrackOrArtist[] = rawItems.map((item: RawItem) => {
            if ('link' in item && typeof item.link === 'string') {
              const cached = item as CachedItem;
              return {
                id: cached.id,
                uri: cached.uri || `spotify:${type === 'tracks' ? 'track' : 'artist'}:${cached.id}`,
                name: cached.name,
                image: cached.image,
                link: cached.link,
                artist: cached.artist
              };
            }
            if ('artists' in item) {
              const track = item as SpotifyTrackRaw;
              return {
                id: track.id,
                uri: track.uri,
                name: track.name,
                image: track.album.images[0]?.url || '',
                link: track.external_urls.spotify,
                artist: track.artists.map(a => a.name).join(', ')
              };
            }
            const artist = item as SpotifyArtistRaw;
            return {
              id: artist.id,
              uri: artist.uri,
              name: artist.name,
              image: artist.images?.[0]?.url || '',
              link: artist.external_urls.spotify,
              artist: undefined
            };
          });

          // 3. Aggiorna lo stato e salva fisicamente nel localStorage del browser
          setItems(formattedData);
          setTotalItems(response.total || formattedData.length);
          localStorage.setItem(cacheKey, JSON.stringify({
            data: formattedData,
            total: response.total || formattedData.length
          }));
        }
      } catch (err) { 
        console.warn("Errore rete/backend. Controllo cache locale...", err); 
        
        // 4. FALLBACK OFFLINE: Se il fetch fallisce, cerca nel localStorage
        const localCache = localStorage.getItem(cacheKey);
        if (localCache) {
          const parsed = JSON.parse(localCache);
          setItems(parsed.data);
          setTotalItems(parsed.total);
          console.log("Dati caricati dalla cache locale (Modalità Offline)");
        } else {
          // Solo se non c'è proprio nulla, allora svuota
          setItems([]);
        }
      } finally { 
        setLoading(false); 
      }
    };

    loadData();
  }, [type, range, user]);

  // --- LOGICA PLAYBACK ---
  const handlePlayPause = async (trackUri: string, trackId: string) => {
    if (!playerInstance || !deviceId) return;
    if (playingId === trackId) {
      await playerInstance.pause();
      setPlayingId(null);
      return;
    }
    try {
      const tokenRes = await fetch(`${BACKEND_URL}/api/spotify/access_token`, { credentials: 'include' });
      const { accessToken }: { accessToken: string } = await tokenRes.json();
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [trackUri] }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
      });
      setPlayingId(trackId);
    } catch (err) { console.error("Errore riproduzione:", err); }
  };

  const estimatedMinutes = useMemo(() => {
    const multiplier = range === 'long_term' ? 5 : range === 'medium_term' ? 3 : 1;
    return Math.floor(totalItems * multiplier * 3.2);
  }, [totalItems, range]);

  if (!user) return <Navigate to="/" />;

 return (
  <div className="min-h-screen text-slate-200 font-sans p-4 md:p-8 relative bg-[#020203]">
    <NeonBackground />
    <MouseTracker />
    
    <main className="max-w-6xl mx-auto space-y-8 relative z-10">
      <header className="flex justify-between items-center px-4">
        <div className="flex items-center gap-4">
          <Logo size="md" />
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-[10px] font-black text-brand uppercase border-b border-brand/10 hover:border-brand pb-1 transition-all">
          ← Dashboard
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* sezione profilo */}
        <div className="p-6 flex items-center gap-6 animate-avatar-vibe">
          <div className="relative group">
            {/* Glow dinamico sotto l'avatar */}
            <div className={`absolute -inset-4 rounded-full opacity-20 blur-2xl transition-all duration-700 ${!isOffline ? 'bg-brand' : 'bg-transparent'}`}></div>
            
            {/* avatar container */}
            <div className={`relative w-20 h-20 rounded-full border-[4px] p-1 transition-all duration-700 
              ${!isOffline 
                ? 'border-brand shadow-[0_0_20px_rgba(199,154,0,0.3)]' 
                : 'border-white/10 bg-white/5'}`}>
              
              <img 
                src={user.images?.[0]?.url || ''} 
                className={`w-full h-full rounded-full object-cover transition-all duration-700 ${!isOffline ? 'grayscale-0' : 'grayscale opacity-50'}`} 
                alt="Profile" 
              />

              {/* status sticker */}
              <div className={`absolute -top-1 -left-2 text-black text-[7px] font-black px-2 py-0.5 rounded-md uppercase shadow-2xl rotate-[-10deg] z-20 transition-all duration-500
                ${!isOffline ? 'bg-brand shadow-brand/30' : 'bg-red-600 text-white shadow-red-600/30'}`}>
                {!isOffline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-white uppercase italic leading-tight">{user.display_name}</h2>
            <p className="text-[8px] text-brand/60 font-black uppercase italic">Spotify Stats</p>
          </div>
        </div>

        {/* widget minuti stimati */}
        <div className="md:col-span-2 bg-glass-gradient backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 flex items-center justify-between">
          <div>
            <h3 className="text-[9px] font-black uppercase text-slate-400 mb-2">Minuti stimati</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-white italic drop-shadow-[0_0_1px_rgba(255,255,255,0.3)]">
                {estimatedMinutes.toLocaleString()}
              </span>
              <span className="text-brand font-black text-xs uppercase italic">min</span>
            </div>
          </div>
          <div className="text-right border-l border-white/10 pl-10">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Stima ore</p>
            <p className="text-4xl font-black text-white italic drop-shadow-[0_0_1px_rgba(255,255,255,0.3)]">
              ~{Math.round(estimatedMinutes / 60)}h
            </p>
          </div>
        </div>
      </div>

      {/* sezione tabella statistiche */}
      <section className="bg-glass-gradient backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden flex flex-col h-[620px]">
        <div className="p-8 border-b border-white/10 flex flex-col md:flex-row justify-between items-center bg-white/[0.02] gap-4">
          <div className="bg-white/5 p-1.5 rounded-2xl flex border border-white/5">
            <button 
              onClick={() => setType('artists')} 
              className={`px-12 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${type === 'artists' ? 'bg-brand text-brand-dark shadow-lg shadow-brand/20' : 'text-slate-400 hover:text-white'}`}
            >
              Artisti
            </button>
            <button 
              onClick={() => setType('tracks')} 
              className={`px-12 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${type === 'tracks' ? 'bg-brand text-brand-dark shadow-lg shadow-brand/20' : 'text-slate-400 hover:text-white'}`}
            >
              Brani
            </button>
          </div>

          <div className="bg-white/5 p-1.5 rounded-2xl flex border border-white/5">
            {[
              { id: 'short_term', label: '1 Mese' },
              { id: 'medium_term', label: '6 Mesi' },
              { id: 'long_term', label: '1 Anno' }
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`px-6 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${
                  range === r.id ? 'bg-white/10 text-brand border border-brand/20' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-4">
          <table className="w-full border-separate border-spacing-y-4">
            <tbody>
              {loading ? (
                <tr>
                  <td className="text-center py-40 text-brand font-black uppercase text-[10px] tracking-widest animate-pulse">
                    Caricamento statistiche...
                  </td>
                </tr>
              ) : items.map((item, index) => (
                <tr key={item.id} className="group bg-white/[0.02] hover:bg-white/[0.04] transition-all rounded-2xl overflow-hidden">
                  <td 
                    className="p-4 w-20 text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent select-none" 
                    style={{ WebkitTextStroke: '1px rgba(199, 154, 0, 0.4)' }}
                  >
                    {(index + 1).toString().padStart(2, '0')}
                  </td>

                  <td className="p-2">
                    <div className="flex items-center gap-6">
                      <img 
                        src={item.image} 
                        className={`w-14 h-14 object-cover ${type === 'artists' ? 'rounded-full' : 'rounded-xl'} border border-white/10 shadow-lg`} 
                        alt={item.name} 
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white uppercase italic truncate tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-brand/70 font-bold uppercase mt-0.5 truncate tracking-wider">
                          {type === 'tracks' ? item.artist : 'Top Artist'}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-right">
                    {type === 'tracks' ? (
                      <button 
                        onClick={() => handlePlayPause(item.uri, item.id)}
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-500 shadow-xl ${
                          playingId === item.id 
                            ? 'bg-brand text-brand-dark border-brand shadow-brand/40 scale-110' 
                            : 'bg-white/5 text-white/40 border-white/10 hover:text-brand hover:border-brand/50 hover:bg-brand/5'
                        }`}
                      >
                        {playingId === item.id ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        ) : (
                          <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        )}
                      </button>
                    ) : (
                      <a 
                        href={item.link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-white/5 text-white/40 hover:text-brand hover:border-brand/50 hover:bg-brand/5 transition-all duration-500 shadow-xl"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.491 17.293a.748.748 0 01-1.03.249c-2.862-1.748-6.464-2.144-10.707-1.176a.751.751 0 01-.334-1.464c4.646-1.062 8.627-.611 11.822 1.341a.749.749 0 01.249 1.05zm1.466-3.264a.938.938 0 01-1.288.309c-3.276-2.012-8.271-2.597-12.146-1.419a.938.938 0 11-.546-1.794c4.425-1.343 9.932-.693 13.67 1.604a.938.938 0 01.31 1.3zm.126-3.407c-3.928-2.333-10.413-2.548-14.186-1.402a1.125 1.125 0 11-.652-2.156c4.331-1.314 11.492-1.06 16.012 1.623a1.125 1.125 0 01-1.174 1.935z"/>
                        </svg>
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
  );
};

export default Statistics;