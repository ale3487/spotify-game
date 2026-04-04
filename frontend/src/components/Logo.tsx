/**
 * @file Logo.tsx
 * @description Componente Brand Identity con effetti visivi avanzati.
 * Implementa un sistema di filtri SVG per il bagliore neon, stratificazione del testo
 * per profondità visiva e navigazione integrata tramite React Router.
 */

import { Link } from 'react-router-dom';

/**
 * Proprietà per la personalizzazione del Logo.
 */
interface LogoProps {
  /** Classi CSS aggiuntive opzionali */
  className?: string;
  /** Variante dimensionale predefinita */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente Logo.
 * Genera l'identità visiva "BeatMatch" con un effetto neon dinamico.
 * * Il componente utilizza tre strati di testo:
 * 1. Shadow Layer: Bagliore diffuso (blur-xl).
 * 2. Neon Layer: Bagliore concentrato tramite filtro SVG.
 * 3. Main Layer: Testo nitido in primo piano.
 * * @param props - Proprietà del componente.
 */
export const Logo = ({ size = 'md' }: LogoProps) => {
  /** Mappatura delle classi di tailwind per le diverse scale dimensionali */
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-6xl md:text-8xl"
  };

  return (
    /* Navigazione alla Home Page con interazione hover scalabile */
    <Link to="/" className="relative group btn-interact flex flex-col outline-none">
      
      {/* FILTRI SVG (Z-Index 0) 
        Definiamo il filtro neon qui per poterlo riutilizzare tramite ID.
        stdDeviation="3" controlla la 'morbidezza' del bagliore.
      */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="blur" in2="SourceGraphic" operator="over" />
          </filter>
        </defs>
      </svg>

      <div className="relative">
        {/* STRATO 1: Ombra dorata soffusa (Ambient Glow) */}
        <span 
          className={`absolute inset-0 text-brand blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-700 font-black uppercase italic tracking-tighter ${sizeClasses[size]}`}
          aria-hidden="true"
        >
          BeatMatch
        </span>

        {/* STRATO 2: Effetto Neon filtrato (Core Glow) */}
        <span 
          className={`absolute inset-0 text-brand/70 transition-all duration-500 font-black uppercase italic tracking-tighter ${sizeClasses[size]}`}
          style={{ filter: 'url(#neon-glow)' }}
          aria-hidden="true"
        >
          BeatMatch
        </span>

        {/* STRATO 3: Testo Principale (Readable Content) */}
        <span className={`relative z-10 text-white font-black uppercase italic tracking-tighter ${sizeClasses[size]}`}>
          <span className="text-brand">Beat</span>Match
        </span>
      </div>

    </Link>
  );
};