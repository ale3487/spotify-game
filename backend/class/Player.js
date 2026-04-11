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
  #isReady = false;
  #score = 0;

  /**
   * Crea un nuovo giocatore.
   * @param {string} socketId - ID univoco della connessione Socket.io
   * @param {Object} userData - Dati dell'utente da Spotify
   * @param {string} userData.spotifyId - ID univoco di Spotify
   * @param {string} userData.display_name - Nome visualizzato dell'utente
   * @param {boolean} [isHost=false] - Se true, indica che questo giocatore è l'host della stanza
   */
  constructor(socketId, userData, isHost = false) {
    this.#id = socketId;
    this.#spotifyId = userData.spotifyId;
    this.#displayName = userData.display_name;
    this.#isHost = isHost;
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
   * Restituisce i dati pubblici del giocatore per l'invio ai client.
   * Esclude informazioni sensibili come gli ID interni.
   * @returns {Object} Oggetto con i dati pubblici
   * @returns {string} return.id - ID del giocatore
   * @returns {string} return.displayName - Nome visualizzato
   * @returns {boolean} return.isHost - Se è host
   * @returns {boolean} return.isReady - Se è pronto
   * @returns {number} return.score - Punteggio attuale
   */
  getData() {
    return {
      id: this.#id,
      displayName: this.#displayName,
      isHost: this.#isHost,
      isReady: this.#isReady,
      score: this.#score
    };
  }
}