/**
 * @file socket.js
 * @description Gestisce i listener Socket.io per la comunicazione real-time.
 * Implementa la logica di creazione stanze, unione giocatori, gestione dello stato di gioco,
 * sincronizzazione e disconnessione.
 */

import { roomManager } from './class/RoomManager.js';

/**
 * Inizializza la logica Socket.io con i listener di connessione.
 * @param {import('socket.io').Server} io - Istanza del server Socket.io
 */
export const initSocketLogic = (io) => {
  io.on('connection', (socket) => {
    console.log(`[SOCKET] Nuovo client connesso: ${socket.id}`);

    /**
     * Listener: Creazione di una nuova stanza.
     * Il giocatore diventa automaticamente host della stanza.
     */
    socket.on('create_room', (userData) => {
      const room = roomManager.createRoom();
      room.addPlayer(socket.id, userData);
      socket.join(room.roomId);
      socket.emit('room_update', room.getRoomState());
    });

    /**
     * Listener: Unione di un giocatore a una stanza esistente.
     * Invia l'aggiornamento dello stato della stanza a tutti i giocatori.
     */
    socket.on('join_room', ({ roomId, userData }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return socket.emit('error', 'Stanza non trovata');

      try {
        room.addPlayer(socket.id, userData);
        socket.join(room.roomId);
        io.to(room.roomId).emit('room_update', room.getRoomState());
      } catch (e) {
        socket.emit('error', e.message);
      }
    });

    socket.on('set_ready', ({ roomId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;
      const player = room.getRawPlayer(socket.id);
      if (player) {
        player.isReady = true;
        io.to(room.roomId).emit('room_update', room.getRoomState());
      }
    });

    /**
     * Listener: Avvia la partita (solo l'host può avviarla).
     * Controlla che almeno 2 giocatori siano presenti e pronti.
     */
    socket.on('start_game', ({ roomId }) => {
      const room = roomManager.getRoom(roomId);
      if (room && room.getRawPlayer(socket.id)?.isHost && room.checkStartCondition()) {
        room.status = 'PLAYING';
        io.to(room.roomId).emit('room_update', room.getRoomState());
      }
    });

    // DISCONNESSIONE
    socket.on('disconnect', () => {
      const roomId = roomManager.findAndRemovePlayer(socket.id);
      if (roomId) {
        const room = roomManager.getRoom(roomId);
        if (room) {
          io.to(roomId).emit('room_update', room.getRoomState());
        }
      }
      console.log(`[SOCKET] Client disconnesso: ${socket.id}`);
    });
  });
};