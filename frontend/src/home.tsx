import { useState, useEffect } from 'react';
import { loginSpotify } from './login'; // Assicurati che il percorso sia corretto

// --- ICONE (Definite fuori per stabilità) ---
const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.7-1.6-6-2-10-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.4-1 8.2-.5 11.1 1.2.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-3.1-1.9-7.8-2.5-11.4-1.4-.5.1-1-.2-1.1-.7s.2-1 .7-1.1c4.2-1.3 9.4-.6 13 1.6.4.3.5.9.3 1.3zm.1-3.4c-3.7-2.2-9.8-2.4-13.3-1.3-.6.2-1.2-.2-1.4-.7s.2-1.2.7-1.4c4.1-1.2 10.8-1 15.1 1.5.5.3.7 1 .4 1.5-.4.4-1 .6-1.5.4z" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

// --- 1. GENERAZIONE PARTICELLE STATICHE ---
const STATIC_PARTICLES = Array.from({ length: 28 }).map((_, i) => ({
  id: i,
  // Scegliamo icone diverse
  Component: i % 2 === 0 ? "note-single" : "note-double",
  size: Math.floor(Math.random() * 30) + 18,
  left: Math.random() * 100,
  top: Math.random() * 100,
  delay: Math.random() * 5,
  duration: Math.random() * 12 + 8,
}));

// --- 2. COMPONENTE HOME ---
const Home = () => {
  const [hasMoved, setHasMoved] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!hasMoved) setHasMoved(true);
      
      // Aggiorniamo le variabili CSS per l'effetto torcia
      const root = document.documentElement;
      root.style.setProperty('--mouse-x', `${e.clientX}px`);
      root.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [hasMoved]);

  return (
    <div className="relative bg-brand-dark text-white font-sans antialiased min-h-screen overflow-hidden selection:bg-brand/30">
      
      {/* 3. SFONDO PARTICELLE*/}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-60">
        {STATIC_PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute text-brand/60 animate-music-float" // Usa l'animazione definita nel CSS
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          >
            {p.Component === "note-single" ? (
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
            ) : (
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path d="M16 3h-6v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4v4.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V3z" /></svg>
            )}
          </div>
        ))}
      </div>

      {/* 4. EFFETTO TORCIA NEON POTENZIATO  */}
      <div 
        className={`pointer-events-none fixed inset-0 z-10 transition-opacity duration-700 ease-out bg-spotlight ${hasMoved ? 'opacity-100' : 'opacity-0'}`}
      />
      <div 
        className={`pointer-events-none fixed inset-0 z-10 transition-opacity duration-700 ease-out bg-spotlight-diffuse ${hasMoved ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* 5. HEADER SOSPESO ISOLATO */}
      <header className="fixed top-0 left-0 w-full z-50 p-8 flex justify-between items-center pointer-events-none">
        
        {/* LOGO (SX) */}
        <div className="pointer-events-auto group flex items-center gap-4 bg-white/[0.03] backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl shadow-xl">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(199,154,0,0.6)] group-hover:scale-110 transition-transform">
            <SpotifyIcon className="w-6 h-6 text-brand-dark" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter leading-none">BEATMATCH</span>
            <span className="text-[9px] font-bold text-brand/70 tracking-[0.3em] uppercase">Audio Quiz</span>
          </div>
        </div>

        {/* LOGIN (DX) - TASTO NERO CHE SI RIEMPIE AL PASSAGGIO */}
        <div className="pointer-events-auto">
          <button 
            onClick={loginSpotify}
            className="group relative overflow-hidden bg-white/5 border border-white/10 py-3 px-8 rounded-2xl transition-all duration-300 hover:border-brand/60 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          >
            {/* Strato giallo che si riempie dal basso */}
            <div className="absolute inset-0 bg-brand translate-y-[102%] group-hover:translate-y-0 transition-transform duration-300"></div>
            {/* Testo uppercase e distanziato */}
            <span className="relative z-10 uppercase text-xs font-black tracking-widest group-hover:text-brand-dark transition-colors">
              Login
            </span>
          </button>
        </div>
      </header>

      <main className="relative z-20">
        {/* HERO SECTION */}
        <section className="relative h-screen flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-7xl md:text-[10rem] font-black mb-8 leading-[0.8] tracking-tighter">
            PROVA CHE HAI <br />
            <span className="text-brand drop-shadow-[0_0_55px_rgba(199,154,0,0.9)] italic">
              GUSTI MIGLIORI
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 mb-12 max-w-2xl font-medium tracking-tight">
            Sfida i tuoi amici in quiz musicali generati dai vostri ascolti reali su Spotify.
          </p>
          
          {/* TASTO CENTRALE - SEMPRE ACCESO, SOLIDO E LUMINOSO*/}
          <button 
            onClick={loginSpotify}
            className="flex items-center gap-4 bg-brand hover:bg-brand-hover text-brand-dark font-black py-6 px-12 rounded-full transition-all scale-110 shadow-[0_0_60px_rgba(199,154,0,0.6)] hover:scale-120"
          >
            <SpotifyIcon className="w-7 h-7 text-brand-dark" />
            <span className="uppercase text-sm tracking-wider">Inizia la Sessione</span>
          </button>
        </section>

        {/* FEATURE CARD - MULTIGLIOCATORE */}
        <section className="pb-32 flex justify-center px-4">
          <div className="max-w-4xl w-full bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-3xl p-16 rounded-[50px] border border-white/10 text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="w-20 h-20 bg-brand/10 rounded-3xl flex items-center justify-center mb-8 mx-auto text-brand border border-brand/20">
              <UsersIcon className="w-10 h-10" />
            </div>
            <h3 className="text-5xl font-black mb-6 tracking-tighter uppercase text-white">Multiplayer Live</h3>
            <p className="text-gray-400 text-xl leading-relaxed max-w-2xl mx-auto font-medium">
              Crea una stanza, sfida chi vuoi e dimostra di conoscere la musica meglio di chiunque altro. In tempo reale.
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-20 py-12 text-center text-gray-800 text-[11px] font-bold uppercase tracking-[0.5em] bg-brand-dark border-t border-white/5">
        © 2026 BeatMatch Gaming / Powered by Spotify API
      </footer>
    </div>
  );
};

export default Home;