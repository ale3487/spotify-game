// socket.js 
import { roomManager } from './class/RoomManager.js';

export const initSocketLogic = (io) => {
  io.on('connection', (socket) => {
    console.log(`[SOCKET] Nuovo client connesso: ${socket.id}`);

    // CREAZIONE
    socket.on('create_room', (userData) => {
      const room = roomManager.createRoom();
      room.addPlayer(socket.id, userData);
      socket.join(room.roomId);
      
      // Invio l'aggiornamento
      socket.emit('room_update', room.getRoomState());
    });

    // UNIONE
    socket.on('join_room', ({ roomId, userData }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return socket.emit('error', 'Stanza non trovata');

      try {
        room.addPlayer(socket.id, userData);
        socket.join(room.roomId);
        // Notifica a TUTTI nella stanza, incluso il nuovo arrivato
        io.to(room.roomId).emit('room_update', room.getRoomState());
      } catch (e) {
        socket.emit('error', e.message);
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