import { io, Socket } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

class SocketService {
  private _socket: Socket | null = null;

  public connect(): Socket {
    if (!this._socket) {
      this._socket = io(BACKEND_URL, {
        withCredentials: true,
        transports: ['websocket'],
        autoConnect: true,
      });

      this._socket.on("connect", () => {
        console.log(`[SOCKET] Connesso: ${this._socket?.id}`);
      });
    }
    return this._socket;
  }

  public get socket(): Socket | null {
    return this._socket;
  }

  public disconnect(): void {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
  }
}

export const socketService = new SocketService();