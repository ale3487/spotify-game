/**
 * @file findChorusTimestamp.js
 * @description Trova il timestamp d'inizio del ritornello nei testi sincronizzati.
 * Implementa matching line-by-line con tolleranza di errore (80% match).
 */

/**
 * Utility interna per pulire le stringhe durante il confronto.
 * Rimuove tutto ciò che non è alfanumerico.
 * @param {string} str 
 * @returns {string}
 */
const normalizeForMatch = (str) => 
  str.toLowerCase().replace(/[^a-z0-9]/g, "").trim();


/**
 * Trova il timestamp d'inizio di un blocco di testo all'interno dei testi sincronizzati.
 * Utilizza un algoritmo di pattern matching che richiede l'80% di corrispondenza
 * con le linee del ritornello per identificare il blocco corretto.
 * 
 * @param {string} syncedLyrics - Il testo con i timestamp in formato [mm:ss.xx] seguito dal testo
 * @param {string} chorusText - Il testo del ritornello (senza timestamp)
 * @returns {string|null} Il timestamp nel formato "mm:ss.xx" (es. "01:01.15"), "00:45.00" se chorusText è null o non identificabile
 *                      
 * 
 * @example
 * const timestamp = findChorusTimestamp(syncedLyrics, chorusText);
 * // Ritorna: "01:15.50"
 */
export const findChorusTimestamp = (syncedLyrics, chorusText) => {
  // Se non c'è il testo del ritornello, fallback standard
  if (!syncedLyrics || !chorusText) return "00:45.00";
  //normalizzazione del testo del ritornello per il matching
  const chorusLines = chorusText
    .split('\n')
    .map(line => normalizeForMatch(line))
    .filter(line => line.length > 0);
  // Se non ci sono linee valide nel ritornello, fallback standard
  if (chorusLines.length === 0) return "00:45.00";

  const lines = syncedLyrics.split('\n');
  const firstLineToFind = chorusLines[0];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    
    // estrazione del timestamp [00:00.00] o [00:00]
    const timeMatch = currentLine.match(/^\[(\d{2}:\d{2}(?:\.\d{2})?)\]/);
    if (!timeMatch) continue;

    const timestamp = timeMatch[1];
    // Pulizia del testo rimuovendo i tag e normalizzando per il confronto
    const textAfterTag = currentLine.replace(/^\[.*?\]/, "");
    const normalizedSyncedText = normalizeForMatch(textAfterTag);

    // Se la riga attuale normalizzata contiene la prima riga del ritornello
    if (normalizedSyncedText.includes(firstLineToFind) || firstLineToFind.includes(normalizedSyncedText)) {
      
      let matchCount = 0;
      // Controllo delle righe successive per sicurezza (tolleranza 80%)
      for (let j = 0; j < Math.min(chorusLines.length, 5); j++) {
        if (lines[i + j]) {
          const nextSynced = normalizeForMatch(lines[i + j].replace(/^\[.*?\]/, ""));
          if (nextSynced.includes(chorusLines[j]) || chorusLines[j].includes(nextSynced)) {
            matchCount++;
          }
        }
      }

      if (matchCount / Math.min(chorusLines.length, 5) >= 0.8) {
        // Formattiamo il timestamp se mancano i centesimi
        return timestamp.includes('.') ? timestamp : `${timestamp}.00`;
      }
    }
  }

  return "00:45.00";
};
