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
const fastClean = (text) => {
  if (!text) return "";
  // Una passata per rimuovere parentesi e punteggiatura comune
  return text.toLowerCase()
    .replace(/[\[\(\]. ,\/#!$%\^&\*;:{}=\-_`~()]/g, "") 
    .replace(/\s+/g, "");
};

export const findChorusByBlocks = (lyrics) => {
  // 1. Se lyrics non è una stringa valida, esci subito
  if (!lyrics || typeof lyrics !== 'string' || lyrics.trim().length === 0) {
    console.warn("Lyrics non valide o assenti per questa canzone.");
    return null; 
  }

  try {
    // 2. Split dei blocchi e pulizia immediata dei valori nulli/vuoti
    const blocks = lyrics.split(/\n\s*\n/).map(b => b.trim()).filter(b => b.length > 0);
    
    if (blocks.length === 0) return null;

    const blockMap = new Map();
    let bestBlock = null;
    let maxCount = 0;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (block.length < 20) continue;

      const key = fastClean(block);
      if (key.length < 10) continue;

      const count = (blockMap.get(key) || 0) + 1;
      blockMap.set(key, count);

      if (count > maxCount) {
        maxCount = count;
        bestBlock = block;
      }
    }

    // Se trova un ritornello con ripetizione, lo ritorna
    if (maxCount > 1 && bestBlock) {
      return bestBlock.replace(/\[.*?\]/g, "").trim();
    }

    // Fallback sicuro: se blocks[1] non esiste, usa blocks[0], se no null
    const fallback = blocks[1] || blocks[0] || null;
    return fallback ? fallback.replace(/\[.*?\]/g, "").trim() : null;

  } catch (error) {
    console.error("Errore durante il calcolo del chorus:", error);
    return null; // Ritorna null invece di far crashare l'intera pagina
  }
};