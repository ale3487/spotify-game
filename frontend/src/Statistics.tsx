/**
 * @file Statistics.tsx
 * @description Componente dashboard per la visualizzazione delle statistiche utente.
 * Gestisce il fetching asincrono, la normalizzazione dei dati e il supporto offline.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { fetchTopUser } from "./spotify.service";
import type { SpotifyUser } from './App';
import { Logo } from './components/Logo'; 

// --- IMPORT COMPONENTI MODULARI ---
import { NeonBackground } from './components/NeonBackground';
import { MouseTracker } from './components/MouseTracker';

// --- INTERFACCE DATI ---
interface CachedItem {
  id: string;
  name: string;
  image: string;
  link: string;
  artist?: string;
}

interface SpotifyArtistRaw {
  id: string;
  name: string;
  images?: { url: string }[];
  external_urls: { spotify: string };
}

interface SpotifyTrackRaw {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  external_urls: { spotify: string };
}

type RawItem = CachedItem | SpotifyArtistRaw | SpotifyTrackRaw;

interface BackendResponse {
  data: RawItem[];
  total?: number;
  type?: string;
  range?: string;
  cached?: boolean;
}

interface TrackOrArtist {
  id: string;
  artist?: string; 
  name: string;
  image: string;
  link: string;
}

interface StatisticsProps {
  user: SpotifyUser | null;
  isOffline?: boolean;
}

const Statistics = ({ user, isOffline }: StatisticsProps) => {
  const [items, setItems] = useState<TrackOrArtist[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [type, setType] = useState<'artists' | 'tracks'>('artists');
  const [range, setRange] = useState<string>('medium_term');
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const response: BackendResponse = await fetchTopUser(type, range);
        const rawItems = response.data || [];
        
        const formattedData: TrackOrArtist[] = rawItems.map((item: RawItem) => {
          if ('link' in item && typeof item.link === 'string') {
            return {
              id: item.id,
              name: item.name,
              image: (item as CachedItem).image,
              link: (item as CachedItem).link,
              artist: (item as CachedItem).artist
            };
          }

          if ('artists' in item) {
            const track = item as SpotifyTrackRaw;
            return {
              id: track.id,
              name: track.name,
              image: track.album.images[0]?.url || '',
              link: track.external_urls.spotify,
              artist: track.artists.map(a => a.name).join(', ')
            };
          }

          const artist = item as SpotifyArtistRaw;
          return {
            id: artist.id,
            name: artist.name,
            image: artist.images?.[0]?.url || '',
            link: artist.external_urls.spotify,
            artist: undefined
          };
        });

        setItems(formattedData);
        setTotalItems(response.total || formattedData.length);
      } catch (err) { 
        console.error("Errore nel recupero delle statistiche:", err); 
        setItems([]);
      } finally { 
        setLoading(false); 
      }
    };
    
    loadData();
  }, [type, range, user]);

  const estimatedMinutes = useMemo(() => {
    const multiplier = range === 'long_term' ? 48 : range === 'medium_term' ? 20 : 7;
    return Math.floor(totalItems * multiplier * 3.2);
  }, [totalItems, range]);

  if (!user) return <Navigate to="/" />;

  return (
    <div className="min-h-screen text-slate-200 font-sans p-4 md:p-8 relative selection:bg-brand selection:text-black overflow-x-hidden bg-[#020203]">
      <NeonBackground />
      <MouseTracker />

      <main className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* HEADER: Navigazione, Brand e Badge Offline */}
        <header className="flex justify-between items-center px-4">
          <div className="pointer-events-auto flex items-center gap-4">
            <Logo size="md" />
            
            {/* BADGE OFFLINE */}
            {isOffline && (
              <div className="bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                Modalita Offline
              </div>
            )}
          </div>
          
          <button 
            onClick={() => navigate('/dashboard')} 
            className="text-[10px] font-black text-brand uppercase tracking-[0.2em] border-b border-brand/10 hover:border-brand transition-all pb-1 outline-none"
          >
            ← Ritorno alla pagina precedente
          </button>
        </header>

        {/* WIDGETS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-glass-gradient backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 flex items-center gap-6 shadow-2xl transition-all duration-500 hover:border-white/20">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-brand/20 blur-2xl animate-pulse"></div>
              <img 
                src={user.images?.[0]?.url || ''} 
                className="w-20 h-20 rounded-full border border-white/20 p-1 object-cover relative z-10"
                alt={user.display_name || 'Profile'} 
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-white uppercase italic truncate">{user.display_name}</h2>
              <p className="text-[8px] text-brand/60 font-black uppercase tracking-[0.3em] mt-1 italic">Spotify User Stats</p>
            </div>
          </div>

          <div className="md:col-span-2 bg-glass-gradient backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden flex items-center justify-between shadow-2xl group transition-all duration-500 hover:border-white/20">
            <div className="relative z-10">
              <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">stima Tempo di ascolto</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-white italic tracking-tighter">
                  {estimatedMinutes.toLocaleString()}
                </span>
                <span className="text-brand font-black text-xs uppercase italic">min</span>
              </div>
            </div>

            <div className="relative z-10 text-right pr-4 border-l border-white/10 pl-10">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Stima ore</p>
              <p className="text-4xl font-black text-white italic leading-none">~{Math.round(estimatedMinutes / 60)}h</p>
              <div className="mt-4 px-4 py-1.5 bg-brand text-brand-dark rounded-full font-black text-[9px] uppercase tracking-tighter shadow-lg shadow-brand/20">
                {estimatedMinutes > 15000 ? "ascoltatore elit" : "ascoltatore appassionato"}
              </div>
            </div>
          </div>
        </div>

        {/* CLASSIFICA SECTION */}
        <section className="bg-glass-gradient backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden flex flex-col h-[620px] shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative transition-all duration-500 hover:border-white/20">
          <div className="p-8 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6 bg-white/[0.02]">
            <div className="bg-white/5 p-1.5 rounded-2xl border border-white/5 flex shadow-inner backdrop-blur-md">
              <button 
                onClick={() => setType('artists')} 
                className={`px-12 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all duration-500 ${type === 'artists' ? 'bg-brand text-brand-dark shadow-lg shadow-brand/20 scale-105' : 'text-slate-400 hover:text-white'}`}
              >
                Artisti
              </button>
              <button 
                onClick={() => setType('tracks')} 
                className={`px-12 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all duration-500 ${type === 'tracks' ? 'bg-brand text-brand-dark shadow-lg shadow-brand/20 scale-105' : 'text-slate-400 hover:text-white'}`}
              >
                Brani
              </button>
            </div>

            <select 
              value={range} 
              onChange={(e) => setRange(e.target.value)} 
              className="bg-white/5 text-brand text-[10px] font-black uppercase px-8 py-3.5 rounded-xl border border-white/10 outline-none cursor-pointer hover:border-brand/50 transition-all appearance-none"
            >
              <option value="short_term">Ultimo mese</option>
              <option value="medium_term">Ultimi 6 mesi</option>
              <option value="long_term">Tutto l'anno</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-4">
            <table className="w-full border-separate border-spacing-y-4">
              <tbody>
                {loading ? (
                  <tr>
                    <td className="text-center py-40 animate-pulse text-brand font-black uppercase tracking-[1em] text-[10px]">
                        Caricamento...
                    </td>
                  </tr>
                ) : items.map((item, index) => (
                  <tr key={item.id} className="group bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-300 rounded-2xl overflow-hidden shadow-sm">
                    <td className="p-4 w-16 text-2xl font-black italic text-white/5 group-hover:text-brand/20 transition-all">
                      {(index + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-6">
                        <div className="relative group/img">
                           <div className="absolute inset-0 bg-brand/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                           <img 
                            src={item.image} 
                            className={`w-14 h-14 object-cover shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-110 ${type === 'artists' ? 'rounded-full border border-white/10' : 'rounded-xl border border-white/10'}`} 
                            alt={item.name} 
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-white uppercase italic group-hover:text-brand transition-colors tracking-tight truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-brand/80 font-medium uppercase tracking-wider mt-0.5 truncate italic">
                            {type === 'tracks' ? item.artist : 'Top Artist'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/5 text-white/10 hover:text-brand hover:border-brand hover:bg-brand/5 transition-all duration-300 shadow-inner"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                        </svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(199, 154, 0, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #c79a00; }
        select option { background-color: #020203; color: white; border: none; padding: 10px; }
      `}</style>
    </div>
  );
};

export default Statistics;