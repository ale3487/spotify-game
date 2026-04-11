/**
 * @file Lyrics.js
 * @description Classe per la gestione dei testi e sincronizzazione temporale.
 * Memorizza i testi sincronizzati, il ritornello identificato e timestamp per la visualizzazione.
 */

/**
 * Rappresenta i testi di una canzone con sincronizzazione temporale.
 * @class Lyrics
 */
export class Lyrics {
    /**
     * Nome della canzone
     * @private
     * @type {string}
     */
    #name;

    /**
     * Artista della canzone
     * @private
     * @type {string}
     */
    #artist;

    /**
     * Testo completo della canzone (non sincronizzato)
     * @private
     * @type {string}
     */
    #lyrics;

    /**
     * Testo del ritornello identificato
     * @private
     * @type {string}
     */
    #chorus;

    /**
     * Timestamp d'inizio del ritornello
     * @private
     * @type {string}
     */
    #timestamp;

    /**
     * Testi sincronizzati con timestamp [mm:ss.xx]
     * @private
     * @type {string}
     */
    #syncedLyrics;

    /**
     * Array di linee sincronizzate parsate
     * @private
     * @type {Array<Object>}
     */
    #syncedLines;

    /**
     * Crea una nuova istanza di Lyrics.
     * @param {string} name - Nome della canzone
     * @param {string} artist - Artista della canzone
     */
    constructor(name, artist) {
        this.#name = name;
        this.#artist = artist;
    }

    // ============ GETTERS ============

    /**
     * Restituisce il nome della canzone.
     * @returns {string}
     */
    get name() { return this.#name; }

    /**
     * Restituisce l'artista della canzone.
     * @returns {string}
     */
    get artist() { return this.#artist; }

    /**
     * Restituisce il testo completo della canzone.
     * @returns {string}
     */
    get lyrics() { return this.#lyrics; }

    /**
     * Restituisce il testo del ritornello.
     * @returns {string}
     */
    get chorus() { return this.#chorus; }

    /**
     * Restituisce i testi sincronizzati con timestamp.
     * @returns {string}
     */
    get syncedLyrics() { return this.#syncedLyrics; }

    /**
     * Restituisce l'array di linee sincronizzate.
     * @returns {Array<Object>}
     */
    get syncedLines() { return this.#syncedLines; }

    /**
     * Restituisce il timestamp d'inizio del ritornello.
     * @returns {string}
     */
    get timestamp() { return this.#timestamp; }

    // ============ SETTERS ============

    /**
     * Imposta il testo completo della canzone.
     * @param {string} value - Testo della canzone
     */
    set lyrics(value) {
        this.#lyrics = value;
    }

    /**
     * Imposta il testo del ritornello.
     * @param {string} value - Testo del ritornello
     */
    set chorus(value) {
        this.#chorus = value;
    }

    /**
     * Imposta i testi sincronizzati con timestamp.
     * @param {string} value - Testi sincronizzati
     */
    set syncedLyrics(value) {
        this.#syncedLyrics = value;
    }

    /**
     * Imposta l'array di linee sincronizzate.
     * @param {Array<Object>} value - Array di linee sincronizzate
     */
    set syncedLines(value) {
        this.#syncedLines = value;
    }

    /**
     * Imposta il timestamp d'inizio del ritornello.
     * @param {string} value - Timestamp nel formato "mm:ss.xx"
     */
    set timestamp(value) {
        this.#timestamp = value;
    }

    /**
     * Serializza l'oggetto Lyrics in un formato JSON.
     * @returns {Object} Oggetto con tutti i dati della canzone
     */
    toJSON() {
        return {
            track: this.name,
            artist: this.artist,
            lyrics: this.lyrics,
            chorus: this.#chorus,
            syncedLyrics: this.syncedLyrics,
            syncedLines: this.syncedLines,
            timestamp: this.timestamp
        };
    }
}