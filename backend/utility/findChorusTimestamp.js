/**
 * Trova il timestamp d'inizio di un blocco di testo all'interno dei testi sincronizzati.
 * @param {string} syncedLyrics - Il testo con i timestamp [mm:ss.xx].
 * @param {string} chorusText - Il testo del ritornello (senza tempi).
 * @returns {string|null} - Il timestamp (es. "01:01.15"), "00:30.00" se non trovo tramite euristica ritornello o null se non trovato.
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