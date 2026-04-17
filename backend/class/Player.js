/**
 * @file Player.js
 * @description Classe che rappresenta un singolo giocatore in una stanza.
 * Gestisce i dati del profilo Spotify, lo stato di gioco (ready, score) e i permessi (host).
 */

/**
 * Rappresenta un singolo giocatore nel gioco BeatMatch.
 * @class Player
 */
export class Player {
  #id;
  #spotifyId;
  #displayName;
  #isHost;
  #imageUrl;
  #defaultAvatarId = this.#spotifyId ? parseInt(this.#spotifyId.slice(-1), 10) % 5 + 1 : 1;
  #isReady = false;
  #score = 0;
  #hasAnswered = false;
  #topTracks = [];
  #topArtists = []; //non utilizzato al momento, ma potrebbe essere interessante mostrarlo in futuro o usarlo per personalizzare le domande

  /**
   * Crea un nuovo giocatore.
   * @param {string} socketId - ID univoco della connessione Socket.io
   * @param {Object} userData - Dati dell'utente da Spotify
   * @param {string} userData.spotifyId - ID univoco di Spotify
   * @param {string} userData.display_name - Nome visualizzato dell'utente
   * @param {boolean} [isHost=false] - Se true, indica che questo giocatore è l'host della stanza
   * @param {string} [userData.images] - Array di immagini del profilo Spotify (si prende la prima se disponibile)
   */
  constructor(socketId, userData, isHost = false) {
    this.#id = socketId;
    this.#spotifyId = userData.spotifyId;
    this.#displayName = userData.display_name;
    this.#isHost = isHost;
    this.#imageUrl = userData.images?.[0]?.url || null;
  }

  // ============ GETTERS ============
  /**
   * Restituisce l'ID socket del giocatore.
   * @returns {string}
   */
  get id() { return this.#id; }

  /**
   * Restituisce il nome visualizzato del giocatore.
   * @returns {string}
   */
  get displayName() { return this.#displayName; }

  /**
   * Controlla se il giocatore è host della stanza.
   * @returns {boolean}
   */
  get isHost() { return this.#isHost; }

  /**
   * Controlla se il giocatore è pronto per iniziare la partita.
   * @returns {boolean}
   */
  get isReady() { return this.#isReady; }

  /**
   * Restituisce il punteggio attuale del giocatore.
   * @returns {number}
   */
  get score() { return this.#score; }

  /**
   * Restituisce lo Spotify ID del giocatore.
   * @returns {string}
   */
  get spotifyId() { return this.#spotifyId; }

  /**
   * Controlla se il giocatore ha già risposto al round corrente.
   * @returns {boolean}
   */
  get hasAnswered() { return this.#hasAnswered; }

  /**
   * Restituisce le tracce più ascoltate del giocatore.
   * @returns {Array} Array di oggetti composti dalla classe Lyrics (track, artist, lyrics, chorus, syncedLyrics, syncedLines, timestamp, uri)
   */

  get topTracks() { return this.#topTracks; }
  
  /**
   * Restituisce gli artisti più ascoltati del giocatore.
   * @returns {Array} Array di oggetti con i dati degli artisti (id, name, imageUrl)
   */
  get topArtists() { return this.#topArtists; }

  /**
   * Restituisce l'URL dell'immagine del profilo del giocatore (da Spotify o null).
   * @returns {string|null}
   */
  get imageUrl() { return this.#imageUrl; }

  /**
   * Restituisce l'ID dell'avatar di default del giocatore (1-5) basato sullo Spotify ID.
   * Se non è disponibile uno Spotify ID, restituisce 1.
   * @returns {number}
   */
  get defaultAvatarId() { return this.#defaultAvatarId; }

  // ============ SETTERS ============

  /**
   * Imposta lo stato di host del giocatore.
   * @param {boolean} value - True se il giocatore deve essere host
   */
  set isHost(value) {
    if (typeof value !== 'boolean') return;
    this.#isHost = value;
  }

  /**
   * Imposta lo stato di prontezza del giocatore.
   * @param {boolean} value - True se il giocatore è pronto
   */
  set isReady(value) {
    this.#isReady = !!value;
  }

  /**
   * Imposta le tracce più ascoltate del giocatore.
   * @param {Array} tracks - Array di oggetti composti dalla classe Lyrics (track, artist, lyrics, chorus, syncedLyrics, syncedLines, timestamp, uri)
    */
  set topTracks(tracks) {
    if (Array.isArray(tracks)) {
      this.#topTracks = tracks;
    }
  }

  /**
   * Imposta gli artisti più ascoltati del giocatore.
   * @param {Array} artists - Array di oggetti con i dati degli artisti (id, name, imageUrl)
  */
  set topArtists(artists) {
    if (Array.isArray(artists)) {
      this.#topArtists = artists;
    }
  }

  /**
   * Imposta lo stato di risposta del giocatore per il round corrente.
   * @param {boolean} value - True se il giocatore ha risposto al round corrente
   */
  set hasAnswered(value) {
    this.#hasAnswered = !!value;
  }

  /**
   * Imposta l'URL dell'immagine del profilo del giocatore.
   * @param {string|null} url - URL dell'immagine o null per nessuna immagine
   */
  set imageUrl(url) {
    this.#imageUrl = url || null;
  }

  // ============ METODI PUBBLICI ============

  /**
   * Aumenta il punteggio del giocatore.
   * Solo valori positivi vengono sommati.
   * @param {number} points - Punti da aggiungere al punteggio
   */
  updateScore(points) {
    if (points > 0) {
      this.#score += points;
    }
  }

  /**
   * Resetta lo stato del giocatore per l'inizio di un nuovo round.
   * Imposta hasAnswered a false per permettere al giocatore di rispondere al nuovo round.
   */
  resetRoundState() {
    this.#hasAnswered = false;
  }

  /**
   * Restituisce i dati pubblici del giocatore per l'invio ai client.
   * Esclude informazioni sensibili come gli ID interni.
   * @returns {Object} Oggetto con i dati pubblici
   * @returns {string} return.id - ID del giocatore
   * @returns {string} return.displayName - Nome visualizzato
   * @returns {boolean} return.isHost - Se è host
   * @returns {boolean} return.isReady - Se è pronto
   * @returns {number} return.score - Punteggio attuale
   * @returns {boolean} return.hasAnswered - Se ha risposto al round corrente
   * @returns {Array} return.topTracks - Tracce più ascoltate (array di oggetti composti dalla classe Lyrics)
   * @returns {Array} return.topArtists - Artisti più ascoltati (array di oggetti con i dati degli artisti)
   * @returns {string|null} return.imageUrl - URL dell'immagine del profilo o null
   * @returns {number} return.defaultAvatarId - ID dell'avatar di default (1-5)
   */
  getData() {
    return {
      id: this.#id,
      displayName: this.#displayName,
      isHost: this.#isHost,
      isReady: this.#isReady,
      score: this.#score,
      hasAnswered: this.#hasAnswered,
      topTracks: this.#topTracks,
      topArtists: this.#topArtists,
      imageUrl: this.#imageUrl,
      defaultAvatarId: this.#defaultAvatarId
    };
  }
}