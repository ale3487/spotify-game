// server/class/RoomManager.js
import { Room } from './Room.js';

export class RoomManager {
  // Mappa privata: roomId -> Istanza della classe Room
  #rooms = new Map();

  /**
   * Crea una nuova stanza con un ID univoco di 5 caratteri.
   * @returns {Room} L'istanza della stanza appena creata.
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
   * Recupera una stanza tramite il suo ID.
   * @param {string} roomId 
   * @returns {Room|undefined}
   */
  getRoom(roomId) {
    return this.#rooms.get(roomId?.toUpperCase());
  }

  /**
   * Rimuove un giocatore da una stanza e distrugge la stanza se vuota.
   * @param {string} roomId 
   * @param {string} socketId 
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
   * Rimuove un giocatore da QUALSIASI stanza (utile alla disconnessione totale).
   * @param {string} socketId 
   * @returns {string|null} Il roomId della stanza lasciata, se presente.
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

  // Getter per debug (opzionale)
  get totalRooms() {
    return this.#rooms.size;
  }
}

// Esportiamo una singola istanza (Singleton) per tutto il server
export const roomManager = new RoomManager();