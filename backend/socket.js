/**
 * @file socket.js
 * @description Gestisce i listener Socket.io per la comunicazione real-time.
 * Implementa la logica di creazione stanze, unione giocatori, gestione dello stato di gioco,
 * sincronizzazione e disconnessione.
 */

import { roomManager } from './class/RoomManager.js';

const handleRoundEnd = (io, room) => {
  // 1. Mostra risultati Round attuale
  const revealData = room.getRevealData();
  console.log(`[ROOM ${room.roomId}] Invio risultati round...`);
  io.to(room.roomId).emit('game_round_results', revealData);

  // 2. Prepara il prossimo round
  const nextRoundData = room.generateNextRound();

  if (nextRoundData) {
    console.log(`[ROOM ${room.roomId}] Emetto game_prepare_next`);
    io.to(room.roomId).emit('game_prepare_next', {
      ...nextRoundData,
      autoplay: false 
    });

    // 3. Pausa di 7 secondi
    setTimeout(() => {
      console.log(`[ROOM ${room.roomId}] Via al round!`);
      io.to(room.roomId).emit('game_start_audio');
      room.startTimer(20000, () => handleRoundEnd(io, room));
    }, 7000); 
  } else {
    console.error(`[ROOM ${room.roomId}] ERRORE: generateNextRound ha restituito undefined!`);
    io.to(room.roomId).emit('game_over', { message: "Partita finita o errore caricamento" });
  }
};


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

/**
 * Listener: Il giocatore abbandona volontariamente la stanza.
 */
socket.on('leave_room', (roomId) => {
  console.log(`[SOCKET] Player ${socket.id} sta lasciando la stanza: ${roomId}`);
  
  // 1. Rimuoviamo il giocatore tramite il manager
  const removedRoomId = roomManager.findAndRemovePlayer(socket.id);
  
  if (removedRoomId) {
    socket.leave(removedRoomId);
    const room = roomManager.getRoom(removedRoomId);
    
    if (room) {
      // Se la stanza esiste ancora (ci sono altri player), notifichiamo l'aggiornamento
      io.to(removedRoomId).emit('room_update', room.getRoomState());
    } else {
      // Se room è undefined, significa che roomManager l'ha già eliminata perché vuota
      console.log(`[SOCKET] Stanza ${removedRoomId} eliminata (vuota).`);
    }
  }
});

/**
 * Listener: Richiesta dello stato di gioco attuale (es. dopo un refresh).
 */
socket.on('request_game_state', ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    
    if (room && room.status === 'PLAYING') {
        const currentTrack = room.roundTrack;
        if (currentTrack) {
            socket.emit('game_command_seek', {
                trackUri: currentTrack.trackUri,
                timestamp: currentTrack.timestamp,
                trackName: currentTrack.track,
                image: currentTrack.image,
                artist: currentTrack.artist,
                round: room.currentRound
            });
        }
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
        // Genera il primo round e ottieni i dati
        const roundData = room.generateNextRound(); 
        
        if (roundData) {
          io.to(room.roomId).emit('room_update', room.getRoomState());
          
          // Pausa di 2.5 secondi prima di inviare il comando di start
          setTimeout(() => {
            io.to(room.roomId).emit('game_command_seek', {
              trackUri: roundData.trackUri,
              timestamp: roundData.timestamp,
              trackName: roundData.trackName,
              artist: roundData.artist,
              image: roundData.image,
              options: roundData.options,
              round: roundData.round
            });

            // Avvia il timer di 20 secondi
            room.startTimer(20000, () => handleRoundEnd(io, room));
          }, 2500);
        }
      }
    });

/**
 * Listener: Ricezione della risposta di un giocatore.
 * Valuta la risposta, aggiorna il punteggio e invia feedback.
 */
  socket.on('submit_answer', ({ roomId, answer }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    // 1. Esegue la logica e ottiene il feedback
    const result = room.submitAnswer(socket.id, answer);

    // 2. Se result è null, significa che il voto è stato scartato (es. doppio click)
    if (result) {
        // Invio feedback immediato al client
        socket.emit('answer_feedback', result);

        // 3. Controllo per vedere se tutti i giocatori hanno risposto
        if (room.allPlayersAnswered()) {
            console.log(" Round completato. Chiudo il timer e invio risultati.");
            room.stopTimer();
            handleRoundEnd(io, room); 
        }
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