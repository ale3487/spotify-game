/**
 * @file icons.tsx
 * @description Collezione di componenti iconografici SVG ottimizzati per React.
 * Tutte le icone ereditano il colore del testo corrente tramite 'currentColor' 
 * e possono essere stilizzate esternamente tramite Tailwind CSS o classi standard.
 */

/**
 * Componente Icona Nota Singola (Croma/Ottavo).
 * Rappresenta visivamente una singola nota musicale con gambo e testa.
 * * @param props - Proprietà del componente.
 * @param props.className - Classi CSS opzionali (es. per dimensioni o colori: "w-6 h-6 text-brand").
 * @returns {JSX.Element} Icona SVG della nota singola.
 */
export const NoteSingle = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 24 24" 
    aria-hidden="true" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
  </svg>
);

/**
 * Componente Icona Nota Doppia (Due Crome unite).
 * Rappresenta visivamente due note musicali collegate da una barra superiore.
 * * @param props - Proprietà del componente.
 * @param props.className - Classi CSS opzionali per il dimensionamento e lo styling.
 * @returns {JSX.Element} Icona SVG della nota doppia.
 */
export const NoteDouble = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 24 24" 
    aria-hidden="true" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M16 3h-6v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4v4.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V3z" />
  </svg>
);