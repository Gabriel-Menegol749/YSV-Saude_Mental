import { io, Socket } from "socket.io-client";
import api from './api.ts';

let socketInstancia: Socket | null = null;

export function connectSocket(token: string): Socket {
    if (socketInstancia) {
        if (socketInstancia.connected) {
            return socketInstancia;
        } else {
            socketInstancia.disconnect();
            socketInstancia = null;
        }
    }

    const socketBaseURL = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';

    console.log(`DEBUG Socket - Tentando conectar em: ${socketBaseURL} com token.`);

    socketInstancia = io(socketBaseURL, {
        auth: { token },
        transports: ["websocket", "polling"],
    });

    socketInstancia.on("connect", () => {
        console.log("Socket conectado com sucesso!");
    });

    socketInstancia.on("disconnect", (reason) => {
        console.log("Socket desconectado:", reason);
    });

    socketInstancia.on("connect_error", (err: Error) => {
        console.error("Socket connect_error:", err.message);
    });

    return socketInstancia;
}

export function getSocket(): Socket {
    if (!socketInstancia || !socketInstancia.connected) {
        throw new Error("Socket não conectado ou não inicializado. Chame connectSocket(token) primeiro.");
    }
    return socketInstancia;
}
