/**
 * @file Home.tsx
 * @description Componente principale della Landing Page. 
 * Gestisce la presentazione visiva, l'integrazione degli effetti di sfondo (Neon/MouseTracker) 
 * e i punti di ingresso per l'autenticazione OAuth con Spotify.
 */

import { loginSpotify } from './service/spotify.service';

// --- IMPORT COMPONENTI MODULARI ---
import { NeonBackground } from './components/NeonBackground';
import { MouseTracker } from './components/MouseTracker';
import { Logo } from './components/Logo';

/**
 * Componente Icona Spotify (SVG).
 * @param props.className - Classi Tailwind per dimensionamento e colori.
 */
const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.7-1.6-6-2-10-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.4-1 8.2-.5 11.1 1.2.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-3.1-1.9-7.8-2.5-11.4-1.4-.5.1-1-.2-1.1-.7s.2-1 .7-1.1c4.2-1.3 9.4-.6 13 1.6.4.3.5.9.3 1.3zm.1-3.4c-3.7-2.2-9.8-2.4-13.3-1.3-.6.2-1.2-.2-1.4-.7s.2-1.2.7-1.4c4.1-1.2 10.8-1 15.1 1.5.5.3.7 1 .4 1.5-.4.4-1 .6-1.5.4z" />
  </svg>
);

/**
 * Componente Icona Users (SVG) per la sezione Multiplayer.
 */
const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

/**
 * Componente Home.
 * Renderizza l'interfaccia utente principale organizzata in 5 layer principali:
 * 1. Background (Effetti Neon)
 * 2. Interattività (Mouse Tracker)
 * 3. Navigazione (Header Fixed)
 * 4. Contenuti (Hero & Features)
 * 5. Informazioni legali (Footer)
 */
const Home = () => {

  return (
    <div className="relative bg-[#020203] text-white font-sans antialiased min-h-screen overflow-x-hidden selection:bg-brand/30">
      
      {/* 1. LAYER SFONDO (Z-0) - Contiene le mesh gradient e i bagliori */}
      <NeonBackground />
      
      {/* 2. LAYER EFFETTO TORCIA (Z-5) - Segue il cursore per l'illuminazione dinamica */}
      <MouseTracker />

      {/* 3. HEADER SOSPESO (Z-50) */}
      <header className="fixed top-0 left-0 w-full z-50 p-6 md:p-8 flex justify-between items-center pointer-events-none">
        
        {/* LOGO BOX: Container con effetto glassmorphism */}
        <div className="pointer-events-auto group flex items-center gap-4 bg-white/[0.03] backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl shadow-2xl transition-all hover:border-brand/40">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(199,154,0,0.4)] group-hover:scale-110 transition-transform duration-500">
            <SpotifyIcon className="w-6 h-6 text-[#020203]" />
          </div>
            <div className="pointer-events-auto flex items-center gap-4">
                <Logo size="md" />
            </div>
        </div>

        {/* LOGIN BUTTON: Pulsante con animazione di riempimento (fill) dal basso */}
        <div className="pointer-events-auto">
          <button 
            onClick={loginSpotify}
            className="group relative overflow-hidden bg-white/5 border border-white/10 py-3 px-8 rounded-2xl transition-all duration-500 hover:border-brand/60 shadow-2xl"
          >
            <div className="absolute inset-0 bg-brand translate-y-[102%] group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
            <span className="relative z-10 uppercase text-[10px] font-black tracking-[0.2em] group-hover:text-[#020203] transition-colors duration-300">
              Login
            </span>
          </button>
        </div>
      </header>

      {/* 4. MAIN CONTENT (Z-10) */}
      <main className="relative z-10">
        
        {/* HERO SECTION: Titolo principale e CTA primaria */}
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
          <div className="space-y-4 mb-10">
            <h1 className="text-6xl md:text-[9rem] font-black leading-[0.85] tracking-tighter uppercase italic">
              PROVA CHE HAI <br />
              <span className="text-brand drop-shadow-[0_0_40px_rgba(199,154,0,0.6)] non-italic">
                GUSTI MIGLIORI
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium tracking-tight">
              Sfida l'algoritmo e i tuoi amici in quiz generati dai vostri ascolti reali. 
              <span className="text-brand/80"> Usiamo sempre le canzoni per raccontare qualcosa.</span>
            </p>
          </div>
          <button 
            onClick={loginSpotify}
            className="btn-interact group flex items-center gap-5 bg-brand text-black font-black py-6 px-14 rounded-full shadow-2xl"
          >
          <SpotifyIcon className="w-7 h-7" />
            <span className="uppercase text-xs tracking-[0.2em]">Inizia Sessione</span>
          </button>
        </section>

        {/* MULTIPLAYER FEATURE CARD: Sezione descrittiva con effetto hover avanzato */}
        <section className="pb-32 flex justify-center px-4">
          <div className="max-w-4xl w-full bg-glass-gradient backdrop-blur-3xl p-12 md:p-20 rounded-[4rem] border border-white/10 text-center shadow-[0_40px_100px_rgba(0,0,0,0.6)] group hover:border-white/20 transition-all duration-700">
            <div className="w-24 h-24 bg-brand/10 rounded-[2rem] flex items-center justify-center mb-10 mx-auto text-brand border border-brand/20 group-hover:scale-110 group-hover:bg-brand/20 transition-all duration-500 shadow-inner">
              <UsersIcon className="w-10 h-10" />
            </div>
            <h3 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter uppercase italic text-white">Multiplayer Live</h3>
            <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
              Crea una stanza, invita la tua cerchia e dimostra di conoscere la musica meglio degli altri. 
              <span className="text-brand/80"> Dati in tempo reale.</span>
            </p>
          </div>
        </section>
      </main>

      {/* 5. FOOTER: Navigazione secondaria e copyright */}
      <footer className="relative z-20 py-12 text-center text-slate-600 text-[9px] font-black uppercase tracking-[0.6em] border-t border-white/5 bg-[#020203]/80 backdrop-blur-md">
        © 2026 BeatMatch Gaming / Powered by Spotify Protocol
      </footer>
    </div>
  );
};

export default Home;