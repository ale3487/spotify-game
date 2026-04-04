/**
 * @file NeonBackground.tsx
 * @description Sistema di particelle ambientali per lo sfondo dell'applicazione.
 * Genera un set statico di icone musicali (NoteSingle/NoteDouble) che fluttuano
 * casualmente nel viewport, creando profondità visiva senza appesantire il DOM.
 */

import { NoteSingle, NoteDouble } from './Icons';

/** Tavolozza di colori neon basata sulle tonalità del brand (Oro/Ambra) */
const NEON_COLORS = ['#c79a00', '#ffd700', '#ffae00', '#f3cf5f'];

/** * Generazione statica dei dati delle particelle.
 * Calcolata fuori dal componente per evitare ricalcoli costosi ad ogni re-render.
 */
const PARTICLES = Array.from({ length: 32 }).map((_, i) => ({
  id: i,
  /** Alternanza tra icona singola e doppia */
  Component: i % 2 === 0 ? NoteSingle : NoteDouble,
  /** Dimensioni casuali tra 15px e 35px */
  size: Math.floor(Math.random() * 20) + 15,
  /** Posizionamento iniziale randomico (percentuale) */
  left: Math.random() * 100,
  top: Math.random() * 100,
  /** Delay negativo per far sì che le animazioni siano già in corso al caricamento */
  delay: Math.random() * -20,
  /** Velocità di fluttuazione variabile tra 15s e 25s */
  duration: Math.random() * 10 + 15,
  color: NEON_COLORS[i % NEON_COLORS.length],
}));

/**
 * Componente NeonBackground.
 * Renderizza un container a tutto schermo posizionato al livello Z più basso (z-0).
 * * Nota: L'animazione 'animate-music-float' deve essere definita nel file tailwind.config.js
 * o nel CSS globale per gestire il movimento (es. traslazione e rotazione leggera).
 */
export const NeonBackground = () => (
  <div 
    className="fixed inset-0 pointer-events-none bg-[#020203]" 
    style={{ zIndex: 0 }}
    aria-hidden="true"
  >
    {PARTICLES.map((p) => (
      <div 
        key={p.id}
        className="absolute animate-music-float"
        style={{
          width: `${p.size}px`,
          height: `${p.size}px`,
          left: `${p.left}%`,
          top: `${p.top}%`,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          color: p.color,
          /** Opacità estremamente bassa per un effetto "ghost" non invasivo */
          opacity: 0.03,
        }}
      >
        <p.Component className="w-full h-full" />
      </div>
    ))}
  </div>
);