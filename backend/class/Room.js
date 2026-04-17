/**
 * @file Room.js
 * @description Classe che gestisce la logica della stanza, dei round e dei punteggi.
 */

import { Player } from './Player.js';

/**
 * Rappresenta una stanza di gioco in BeatMatch.
 * @class Room
 */
export class Room {
  #roomId;
  #players = [];     // Array di istanze Player
  #status = 'LOBBY'; // LOBBY, PLAYING, RESULTS, END
  #maxPlayers = 4;
  
  // Configurazione Round
  #currentRound = 0;
  #totalRounds = 10;
  
  // Dati sensibili del round (gestiti solo dal server)
  #roundData = {
    currentTrack: null,
    correctAnswer: null,
    startTime: null
  };
  #responsesThisRound = new Set()
  
  #timer = null;

  constructor(roomId, totalRounds = 10) {
    this.#roomId = roomId;
    this.#totalRounds = totalRounds;
  }

  // ============ GETTERS ============

// Restituisce gli oggetti Player reali (necessario per il controller spotifyLyrics)
  get playersInstances() { return this.#players; }
  get roomId() { return this.#roomId; }
  get status() { return this.#status; }
  get currentRound() { return this.#currentRound; }
  get totalRounds() { return this.#totalRounds; }
  get players() { return this.#players.map(p => p.getData()); }
  get currentCorrectAnswer() { return this.#roundData.correctAnswer; }
  get roundTrack() { return this.#roundData.currentTrack; }

  // ============ GESTIONE GIOCATORI ============

  /**
   * aggiunge un nuovo giocatore alla stanza. Il primo giocatore ad entrare diventa automaticamente host.
   * Lancia errori se la stanza è piena o se la partita è già iniziata.
   * @param {string} socketId  id del socket del giocatore (univoco per ogni connessione)
   * @param {Object} userData  dati dell'utente (displayName, imageUrl, defaultAvatarId)
   * @returns 
   */
  addPlayer(socketId, userData) {
    if (this.#players.length >= this.#maxPlayers) throw new Error("Stanza piena");
    if (this.#status !== 'LOBBY') throw new Error("Partita già iniziata");
    const isFirst = this.#players.length === 0;
    const newPlayer = new Player(socketId, userData, isFirst);
    this.#players.push(newPlayer);
    return newPlayer;
  }
  /**
   * Rimuove un giocatore dalla stanza.
   * @param {string} socketId  id del socket del giocatore (univoco per ogni connessione)
   */
  removePlayer(socketId) {
    this.#players = this.#players.filter(p => p.id !== socketId);
    if (this.#players.length > 0 && !this.#players.some(p => p.isHost)) {
      this.#players[0].isHost = true; // Passaggio di consegne host
    }
  }

  /**
   * Restituisce l'istanza del giocatore corrispondente all'ID del socket.
   * @param {string} socketId  id del socket del giocatore (univoco per ogni connessione)
   * @returns {Player|null}  L'istanza del giocatore o null se non trovato
   */
  getRawPlayer(socketId) {
    return this.#players.find(p => p.id === socketId);
  }

  // ============ LOGICA DI GIOCO ============

  /**
   * Avvia la partita se tutti sono pronti.
   */
  checkStartCondition() {
    const minPlayers = this.#players.length >= 2; //per debug puo essere abbassato a 1
    const allReady = this.#players.every(p => p.isReady);
    
    if (minPlayers && allReady) {
      this.#status = 'PLAYING';
      return true;
    }
    return false;
  }

  /**
   * Genera un nuovo round pescando dalle Top Tracks dei giocatori.
   */
  generateNextRound() {
  if (this.#currentRound >= this.#totalRounds) {
    this.#status = 'END';
    return null;
  }

  this.#currentRound++;
  this.#status = 'PLAYING';

  // 1. Pesca il protagonista
  const validPlayers = this.#players.filter(p => p.topTracks && p.topTracks.length > 0);
  const protagonist = validPlayers[Math.floor(Math.random() * validPlayers.length)];
  
  // 2. Pesca la traccia del protagonista
  if(!protagonist || !protagonist.topTracks || protagonist.topTracks.length === 0) {
    console.warn(`[ROOM] Nessun protagonista valido per il round ${this.#currentRound}.`);
    return null;
  }
  const track = protagonist.topTracks[Math.floor(Math.random() * protagonist.topTracks.length)];


  // 3. Salva i dati per il server
  this.#roundData = {
    currentTrack: track,
    correctAnswer: protagonist.displayName,
    startTime: Date.now()
  };
  this.#responsesThisRound.clear();
  this.#players.forEach(p => p.resetRoundState());

  // 4. Invia al frontend
  return {
    round: this.#currentRound,
    options: this.#players.map(p => p.displayName),
    trackUri: track.uri,
    trackName: track.track,
    image: track.image,
    artist: track.artist,
    timestamp: track.timestamp
  };
}

  /**
   * Valuta la risposta di un giocatore.
   */
  submitAnswer(socketId, answer) {
    if (this.#status !== 'PLAYING') return null;

    const player = this.getRawPlayer(socketId);
    
    // Controllo critico: se il player non esiste o ha già risposto, ignoriamo la risposta, non dovrebbe mai succedere grazie alla logica del frontend, ma è sempre meglio essere sicuri
    if (!player || player.hasAnswered) {
        return null;
    }

    // 1. registrazione della risposta del giocatore (per evitare risposte multiple)
    player.hasAnswered = true; 
    const isCorrect = answer === this.#roundData.correctAnswer;
    let pointsGained = 0;

    if (isCorrect) {
        pointsGained = 100;
        const timeTaken = (Date.now() - this.#roundData.startTime) / 1000;
        const speedBonus = Math.max(0, Math.floor(50 - (timeTaken * 2)));
        pointsGained += speedBonus;
        player.updateScore(pointsGained);
    }

    return { isCorrect, pointsGained };
  }

  /**
   * Controlla se tutti i giocatori hanno inviato una risposta.
   */
allPlayersAnswered() {
    const participants = this.#players;
    const votes = participants.filter(p => p.hasAnswered).length;
    
    return votes >= participants.length;
}

  /**
   * Restituisce i risultati del round per la fase di "Reveal".
   */
  getRevealData() {
    this.#status = 'RESULTS';
    return {
      correctAnswer: this.#roundData.correctAnswer,
      track: this.#roundData.currentTrack,
      rankings: this.#players
        .map(p => ({ displayName: p.displayName, score: p.score, imageUrl: p.imageUrl, defaultAvatarId: p.defaultAvatarId }))
        .sort((a, b) => b.score - a.score)
    };
  }

  // ============ GESTIONE TIMER ============

  startTimer(ms, callback) {
    this.stopTimer();
    this.#timer = setTimeout(callback, ms);
  }

  stopTimer() {
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
  }

  getRoomState() {
    return {
      roomId: this.#roomId,
      status: this.#status,
      players: this.players,
      currentRound: this.#currentRound,
      totalRounds: this.#totalRounds
    };
  }
}