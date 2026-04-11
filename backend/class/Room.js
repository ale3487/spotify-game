/**
 * @file Room.js
 * @description Classe che rappresenta una stanza di gioco.
 * Gestisce i giocatori, lo stato della partita (LOBBY, PLAYING, RESULTS) e la logica di avvio.
 */

import { Player } from './Player.js';

/**
 * Rappresenta una stanza di gioco in BeatMatch.
 * @class Room
 */
export class Room {
  #roomId;
  #players = [];
  #status = 'LOBBY'; // LOBBY, PLAYING, RESULTS
  #maxPlayers = 5;

  /**
   * Crea una nuova stanza.
   * @param {string} roomId - ID univoco della stanza
   */
  constructor(roomId) {
    this.#roomId = roomId;
  }

  // ============ GETTERS ============

  /**
   * Restituisce l'ID della stanza.
   * @returns {string}
   */
  get roomId() { return this.#roomId; }

  /**
   * Restituisce lo stato attuale della stanza.
   * @returns {string} - 'LOBBY', 'PLAYING', o 'RESULTS'
   */
  get status() { return this.#status; }

  /**
   * Restituisce una copia dell'array di giocatori (per evitare modifiche esterne).
   * @returns {Array<Object>} Array con i dati pubblici dei giocatori
   */
  get players() { 
    return this.#players.map(p => p.getData()); 
  }

  // ============ METODI PUBBLICI ============

  /**
   * Aggiunge un nuovo giocatore alla stanza.
   * Il primo giocatore diventa automaticamente host.
   * @param {string} socketId - ID del socket del nuovo giocatore
   * @param {Object} userData - Dati del profilo Spotify dell'utente
   * @returns {Player} L'istanza del nuovo giocatore
   * @throws {Error} Se la stanza è piena o la partita è già iniziata
   */
  addPlayer(socketId, userData) {
    if (this.#players.length >= this.#maxPlayers) {
      throw new Error("Stanza piena");
    }
    if (this.#status !== 'LOBBY') {
      throw new Error("Partita già iniziata");
    }

    const isFirst = this.#players.length === 0;
    const newPlayer = new Player(socketId, userData, isFirst);
    this.#players.push(newPlayer);
    return newPlayer;
  }

  /**
   * Rimuove un giocatore dalla stanza (es. disconnessione).
   * Se l'host se ne va, il primo giocatore rimanente diventa il nuovo host.
   * @param {string} socketId - ID del socket del giocatore da rimuovere
   */
  removePlayer(socketId) {
    this.#players = this.#players.filter(p => p.id !== socketId);
    
    // Se c'è ancora qualcuno ma manca l'host, ne nominiamo uno nuovo.
    if (this.#players.length > 0 && !this.#players.some(p => p.isHost)) {
      this.#players[0].isHost = true;
    }
  }

  /**
   * Recupera un giocatore specifico dalla stanza (oggetto interno).
   * @param {string} socketId - ID del socket del giocatore
   * @returns {Player|undefined} L'istanza del giocatore o undefined se non trovato
   */
  getRawPlayer(socketId) {
    return this.#players.find(p => p.id === socketId);
  }

  /**
   * Controlla se le condizioni per avviare il gioco sono soddisfatte.
   * Richiede almeno 2 giocatori e che tutti siano pronti.
   * @returns {boolean} True se le condizioni sono soddisfatte
   */
  checkStartCondition() {
    const minPlayers = this.#players.length >= 2;
    const allReady = this.#players.every(p => p.isReady);
    
    if (minPlayers && allReady) {
      this.#status = 'PLAYING';
      return true;
    }
    return false;
  }

  /**
   * Restituisce lo stato completo della stanza per l'invio ai client.
   * @returns {Object} Oggetto con roomId, status e array dei giocatori
   */
  getRoomState() {
    return {
      roomId: this.#roomId,
      status: this.#status,
      players: this.#players.map(p => p.getData())
    };
  }
}