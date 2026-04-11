/**
 * @file socket.service.ts
 * @description Servizio singleton per la gestione della connessione WebSocket con Socket.IO.
 * Fornisce un'interfaccia centralizzata per connettersi, accedere e disconnettersi dal server.
 */

import { io, Socket } from "socket.io-client";

/**
 * URL del backend da cui il frontend si connette
 * @type {string}
 */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

/**
 * Classe singleton per gestire la connessione Socket.io
 * Garantisce una sola istanza del socket per tutta l'applicazione.
 * @class SocketService
 */
class SocketService {
  /**
   * Istanza privata del socket
   * @private
   * @type {Socket | null}
   */
  private _socket: Socket | null = null;

  /**
   * Stabilisce la connessione al server Socket.io se non già connesso.
   * Abilita WebSocket e auto-connessione con credenziali (cookies).
   * 
   * @returns {Socket} L'istanza del socket (già connesso o alla prima connessione)
   */
  public connect(): Socket {
    if (!this._socket) {
      this._socket = io(BACKEND_URL, {
        withCredentials: true, // Include i cookie nelle richieste
        transports: ['websocket'], // Usa WebSocket per comunicazione real-time
        autoConnect: true, // Connessione automatica
      });

      // Logging della connessione riuscita
      this._socket.on("connect", () => {
        console.log(`[SOCKET] Connesso: ${this._socket?.id}`);
      });
    }
    return this._socket;
  }

  /**
   * Restituisce l'istanza corrente del socket (null se non connesso).
   * 
   * @returns {Socket | null}
   */
  public get socket(): Socket | null {
    return this._socket;
  }

  /**
   * Disconnette il socket dal server e resetta l'istanza.
   * Utile per il logout o la pulizia delle risorse.
   */
  public disconnect(): void {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
  }
}

/**
 * Istanza singleton di SocketService esportata
 * Utilizzo: socketService.connect(), socketService.socket, etc.
 * @type {SocketService}
 */
export const socketService = new SocketService();