import { io, Socket } from "socket.io-client";

let socketInstancia: Socket | null = null;

export function connectSocket(token: string){
    if(socketInstancia) return socketInstancia;
    socketInstancia = io("http://localhost:5000", {
        auth: { token },
        transports: ["websocket"],
    });

    socketInstancia.on("conect_error:", (err) => {
        console.error("Socket conect_error", err.message);
    });

    return socketInstancia;
}

export function getSocket(){
    if(!socketInstancia) throw new Error("Socket não conectado, chame connectSocket(token).");
    return socketInstancia;
}
