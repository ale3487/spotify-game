/**
 * @file MouseTracker.tsx
 * @description Implementa un effetto "Spotlight" dinamico basato sulla posizione del cursore.
 * Utilizza un gradiente radiale aggiornato in tempo reale per illuminare le sezioni
 * dell'interfaccia sotto il mouse, migliorando l'immersività della Dark Mode.
 */

import { useEffect, useState } from 'react';

/**
 * Componente MouseTracker.
 * Renderizza un overlay a tutto schermo con un gradiente che segue il movimento del mouse.
 * * Caratteristiche principali:
 * - Gestione eventi 'mousemove' a livello globale (window).
 * - Ottimizzazione tramite cleanup dell'effetto per evitare memory leak.
 * - `pointer-events-none` per non interferire con i click sugli elementi sottostanti.
 */
export const MouseTracker = () => {
  /** Stato per le coordinate X e Y del cursore */
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    /** Aggiorna lo stato con le coordinate correnti del viewport */
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    // Registrazione dell'evento sul movimento del mouse
    window.addEventListener('mousemove', handleMouseMove);

    // Rimozione del listener alla smontaggio del componente
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 5, // Posizionato sopra lo sfondo neon (z-0) ma sotto i contenuti (z-10+)
        /**
         * Gradiente radiale dinamico:
         * - 450px: raggio dell'effetto luce.
         * - rgba(199, 154, 0, 0.4): colore brand "BeatMatch" con opacità al centro.
         * - transparent: sfumatura completa verso l'esterno.
         */
        background: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, 
          rgba(199, 154, 0, 0.15) 0%, 
          rgba(199, 154, 0, 0.05) 30%, 
          transparent 80%)`,
      }}
    />
  );
};