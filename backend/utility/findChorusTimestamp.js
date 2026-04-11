/**
 * @file findChorusTimestamp.js
 * @description Trova il timestamp d'inizio del ritornello nei testi sincronizzati.
 * Implementa matching line-by-line con tolleranza di errore (80% match).
 */

/**
 * Trova il timestamp d'inizio di un blocco di testo all'interno dei testi sincronizzati.
 * Utilizza un algoritmo di pattern matching che richiede l'80% di corrispondenza
 * con le linee del ritornello per identificare il blocco corretto.
 * 
 * @param {string} syncedLyrics - Il testo con i timestamp in formato [mm:ss.xx] seguito dal testo
 * @param {string} chorusText - Il testo del ritornello (senza timestamp)
 * @returns {string|null} Il timestamp nel formato "mm:ss.xx" (es. "01:01.15"), 
 *                       "00:30.00" se chorusText è null,
 *                       null se non trovato
 * 
 * @example
 * const timestamp = findChorusTimestamp(syncedLyrics, chorusText);
 * // Ritorna: "01:15.50"
 */
export const findChorusTimestamp = (syncedLyrics, chorusText) => {
  if (!syncedLyrics) return null;
  if (!chorusText) {
    let syncedLines = {time: "00:30.00"};
    return syncedLines.time;
  }

  // 1. pulizzia del testo del ritornello: split in linee, trim, lowercase, filter vuote
  const chorusLines = chorusText
    .split('\n')
    .map(line => line.trim().toLowerCase())
    .filter(line => line.length > 0);

  if (chorusLines.length === 0) return null;

  // 2. parsiamo i testi sincronizzati in un array di oggetti { time, text }
  const syncedLines = syncedLyrics.split('\n').map(line => {
    // per catturare [00:00.00] e il resto del testo
    const match = line.match(/^\[(\d{2}:\d{2}\.\d{2})\]\s*(.*)$/);
    if (match) {
      return {
        time: match[1],
        text: match[2].trim().toLowerCase()
      };
    }
    return null;
  }).filter(line => line !== null);

  // 3. ricerca del blocco di testo che corrisponde al ritornello
  // scorrimento delle righe
  for (let i = 0; i < syncedLines.length; i++) {
    // Se la riga attuale della canzone corrisponde alla prima riga del ritornello
    if (syncedLines[i].text === chorusLines[0]) {
      
      // Verificha se anche le righe successive corrispondono (almeno le prime 2-3)
      let matchCount = 0;
      for (let j = 0; j < chorusLines.length; j++) {
        if (syncedLines[i + j] && syncedLines[i + j].text === chorusLines[j]) {
          matchCount++;
        }
      }

      // Se trovata un match soddisfacente (almeno l'80% delle righe del blocco) ritorniamo il timestamp
      if (matchCount / chorusLines.length >= 0.8) {
        return syncedLines[i].time;
      }
    }
  }

  return null;
};