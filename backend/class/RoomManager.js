/**
 * @file RoomManager.js
 * @description Gestore singleton delle stanze di gioco.
 * Implementa la creazione, recupero e distruzione delle stanze con collision avoidance.
 */

import { Room } from './Room.js';

/**
 * Gestore centralizzato per tutte le stanze di gioco.
 * @class RoomManager
 */
export class RoomManager {
  /**
   * Mappa privata: roomId -> Istanza della classe Room
   * @private
   * @type {Map<string, Room>}
   */
  #rooms = new Map();

  /**
   * Crea una nuova stanza con un ID univoco di 5 caratteri.
   * Utilizza collision avoidance per garantire unicità dell'ID.
   * @returns {Room} L'istanza della stanza appena creata
   */
  createRoom() {
    let roomId;
    // Genera ID finché non ne trova uno non esistente (collision avoidance)
    do {
      roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    } while (this.#rooms.has(roomId));

    const newRoom = new Room(roomId);
    this.#rooms.set(roomId, newRoom);
    
    console.log(`[RoomManager] Stanza creata: ${roomId}. Totale stanze: ${this.#rooms.size}`);
    return newRoom;
  }

  /**
   * Recupera una stanza tramite il suo ID (case-insensitive).
   * @param {string} roomId - ID della stanza da recuperare
   * @returns {Room|undefined} L'istanza della stanza o undefined se non trovata
   */
  getRoom(roomId) {
    return this.#rooms.get(roomId?.toUpperCase());
  }

  /**
   * Rimuove un giocatore da una stanza specifica.
   * Se la stanza rimane vuota, viene distrutta per liberare memoria.
   * @param {string} roomId - ID della stanza
   * @param {string} socketId - ID del socket del giocatore
   */
  handlePlayerLeave(roomId, socketId) {
    const room = this.getRoom(roomId);
    if (!room) return;

    room.removePlayer(socketId);

    // Se non ci sono più giocatori, eliminiamo la stanza per liberare memoria
    if (room.players.length === 0) {
      this.#rooms.delete(roomId);
      console.log(`[RoomManager] Stanza ${roomId} eliminata (vuota).`);
    }
  }

  /**
   * Rimuove un giocatore da QUALSIASI stanza in cui si trovi.
   * Utile per la gestione della disconnessione totale.
   * @param {string} socketId - ID del socket del giocatore
   * @returns {string|null} Il roomId della stanza lasciata, se presente
   */
  findAndRemovePlayer(socketId) {
    for (const [roomId, room] of this.#rooms) {
      const player = room.players.find(p => p.id === socketId);
      if (player) {
        this.handlePlayerLeave(roomId, socketId);
        return roomId;
      }
    }
    return null;
  }

  /**
   * Restituisce il numero totale di stanze attive (utile per debug).
   * @returns {number} Numero di stanze
   */
  get totalRooms() {
    return this.#rooms.size;
  }
}

/**
 * Esportiamo una singola istanza (Singleton) per tutto il server.
 * Questo garantisce che esista un'unica istanza di RoomManager in tutto l'applicazione.
 * @type {RoomManager}
 */
export const roomManager = new RoomManager();