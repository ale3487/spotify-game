// class/Room.js
import { Player } from './Player.js';

export class Room {
  #roomId;
  #players = [];
  #status = 'LOBBY'; // LOBBY, PLAYING, RESULTS
  #maxPlayers = 4;

  constructor(roomId) {
    this.#roomId = roomId;
  }

  get roomId() { return this.#roomId; }
  get status() { return this.#status; }
  
  // Restituisce una copia dell'array per evitare che qualcuno faccia .pop() o .push() dall'esterno
  get players() { 
    return this.#players.map(p => p.getData()); 
  }

  // AGGIUNTA GIOCATORE
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

  // RIMOZIONE GIOCATORE
  removePlayer(socketId) {
    this.#players = this.#players.filter(p => p.id !== socketId);
    
    // Se c'è ancora qualcuno ma manca l'host, ne nominiamo uno nuovo.
    if (this.#players.length > 0 && !this.#players.some(p => p.isHost)) {
      this.#players[0].isHost = true;
    }
  }

  // LOGICA DI AVVIO
  checkStartCondition() {
    const minPlayers = this.#players.length >= 2;
    const allReady = this.#players.every(p => p.isReady);
    
    if (minPlayers && allReady) {
      this.#status = 'PLAYING';
      return true;
    }
    return false;
  }

  // Serializzazione per Socket.io
  getRoomState() {
    return {
      roomId: this.#roomId,
      status: this.#status,
      players: this.players
    };
  }
}