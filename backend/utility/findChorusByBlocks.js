/**
 * @file findChorusByBlocks.js
 * @description Identifica il ritornello di una canzone cercando blocchi di testo ripetuti.
 * Implementa un sistema robusto basato su frequenza per rilevare pattern ricorrenti.
 */

/**
 * Trova il ritornello di una canzone analizzando i blocchi di testo ripetuti.
 * Il ritornello è identificato come il blocco che si ripete più volte o, in fallback,
 * il secondo paragrafo della canzone.
 * 
 * @param {string} lyrics - Il testo completo della canzone suddiviso in paragrafi
 * @returns {string|null} Il testo del ritornello o null se non individuabile
 * 
 * @description Algoritmo:
 * 1. Suddivide il testo in blocchi (paragrafi separati da righe vuote)
 * 2. Normalizza ogni blocco rimuovendo tag, punctuation e whitespace
 * 3. Conta la frequenza di ogni blocco normalizzato
 * 4. Se una ripetizione vera è trovata (count > 1), la ritorna come ritornello
 * 5. Altrimenti, ritorna il secondo paragrafo come fallback (o il primo se unico)
 */
export const findChorusByBlocks = (lyrics) => {
  if (!lyrics) return null;

  // 1. Divisione in blocchi (paragrafi)
  const blocks = lyrics.split(/\n\s*\n/).map(b => b.trim()).filter(b => b.length > 0);
  
  // Se non ci sono blocchi o blocco unico, usciamo
  if (blocks.length === 0) return null;
  if (blocks.length === 1) return null;

  const blockMap = new Map();
  let bestBlock = null;
  let maxCount = 0;

  for (const block of blocks) {
    if (block.length < 20) continue;

    // 2. Chiave di confronto iper-pulita (senza parentesi, tag, ecc.)
    const comparisonKey = block
      .toLowerCase()
      .replace(/\[.*?\]/g, "") 
      .replace(/\(.*?\)/g, "") 
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") 
      .replace(/\s+/g, " ")    
      .trim();

    if (comparisonKey.length < 10) continue;

    const count = (blockMap.get(comparisonKey) || 0) + 1;
    blockMap.set(comparisonKey, count);

    if (count > maxCount) {
      maxCount = count;
      bestBlock = block.replace(/\[.*?\]/g, "").trim();
    }
  }

  // 1. Se viene trovata una ripetizione vera (count > 1), diamo quella.
  if (maxCount > 1) {
    return bestBlock;
  }

  // 2. FALLBACK: Se non c'è una ripetizione, proviamo a prendere il SECONDO paragrafo (indice 1)
  // Se la canzone ha un solo paragrafo, prendiamo il primo (indice 0).
  const fallbackBlock = blocks[1] || blocks[0];
  
  return fallbackBlock ? fallbackBlock.replace(/\[.*?\]/g, "").trim() : null;
};