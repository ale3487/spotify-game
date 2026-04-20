import { useEffect } from 'react';
import { NeonBackground } from './components/NeonBackground';

const ConnectionLost = () => {
  useEffect(() => {
    const handleOnline = () => {
      window.location.replace('/dashboard');
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <div className="min-h-screen bg-[#020203] flex items-center justify-center p-6 relative overflow-hidden">
      <NeonBackground />
      
      {/* Overlay Scanline sottile */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,255,255,0.05),transparent,rgba(255,255,255,0.05))] bg-[length:100%_4px,4px_100%] z-50"></div>

      <div className="relative z-10 w-full text-center">
        
        {/* Testo Unico */}
        <div className="flex flex-col items-center space-y-4 animate-avatar-vibe">
          <h1 className="text-6xl md:text-[100px] font-black text-white uppercase italic tracking-tighter leading-[0.8] mb-2">
            OPSS... <br />
            <span className="text-brand drop-shadow-[0_0_30px_rgba(199,154,0,0.5)]">SEI OFFLINE</span>
          </h1>
          
          <p className="text-[11px] md:text-[13px] text-slate-400 font-black uppercase tracking-[0.5em] leading-relaxed max-w-lg">
            Speriamo tu abbia della musica <br />
            <span className="text-white border-b-2 border-brand mx-1">installata</span> <br />
            nel mentre sei offline.
          </p>
        </div>

        {/* Status sotto la scritta */}
        <div className="mt-24 flex flex-col items-center gap-4">
          <div className="w-12 h-[1px] bg-brand/20"></div>
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 bg-brand rounded-full animate-ping"></div>
             <p className="text-[8px] font-black text-brand/40 uppercase tracking-[0.6em] italic">
               In attesa di connessione...
             </p>
          </div>
        </div>
      </div>

      {/* Glow centrale */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[140px] pointer-events-none opacity-40"></div>
    </div>
  );
};

export default ConnectionLost;

