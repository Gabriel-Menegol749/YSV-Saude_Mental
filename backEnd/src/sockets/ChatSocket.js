import Chat from '../models/Mensagem.js';
import Usuarios from '../models/Usuarios.js';
import jwt from 'jsonwebtoken';

export default function ChatSocket(io){
    const usuariosOnline = new Map();

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if(!token) return next(new Error('Autenticação necessária'));

        try{
            const usuario = jwt.verify(token, process.env.JWT_SECRET);
            socket.usuario = usuario;
            next();
        } catch(err){
            console.error("Erro na autenticação do socket: ", err.message)
            next(new Error('Token inválido'));
        }
    });

    io.on("connection", async (socket) => {
        const IDusuario = socket.usuario.id;
        usuariosOnline.set(IDusuario, socket.id);

        //Marca o usuário como online no banco
        try{
            await Usuarios.findByIdAndUpdate(IDusuario, { statusOnline: true });
            io.emit("AtualizaStatusUsuario", { userId: IDusuario, statusOnline: true});
            console.log(`Usuário conectado: ${socket.usuario.nome} (${IDusuario})`);
        } catch (err){
            console.error("Erro ao atualizar status", err.message);
        }

        socket.on("JoinChat", ({ chatID }) => {
            socket.join(chatID);
            console.log(`Usuário ${socket.usuario.nome} se juntou ao chat ${chatID}`);
        });

        socket.on('sendMessage', async ({ chatID, conteudo }) => {
            try {
                const chat = await Chat.findById(chatID);
                if(!chat) return;

                const novaMensagem = {
                    remetente: IDusuario,
                    conteudo,
                    timestamp: new Date(),
                };

                chat.mensagens.push(novaMensagem);
                await chat.save();

                io.to(chatID).emit('messageReceived', novaMensagem);
            } catch(err){
                console.error('Erro ao enviar Mensagem:', err.message);
            }
        });

        //Configurações para Vídeo Chamadas (WebRTC)
        socket.on("offer", ({ para, offer }) => {
            const destino = usuariosOnline.get(para);
            if(destino) io.to(destino).emit("offer", { de: IDusuario, offer});
        });
        socket.on("answer", ({para, answer}) => {
            const destino = usuariosOnline.get(para);
            if(destino) io.to(destino).emit("answer", { de: IDusuario, answer});
        })
        socket.on("iceCandidate", ({para, candidate}) => {
            const destino = usuariosOnline.get(para);
            if(destino) io.to(destino).emit("iceCandidate", { de: IDusuario, candidate});
        });

        socket.on("disconnect", async () => {
            usuariosOnline.delete(IDusuario);
            try{
                await Usuarios.findByIdAndUpdate(IDusuario, { statusOnline: false });
                io.emit("AtualizaStatusUsuario", { userId: IDusuario,  statusOnline: false});
            } catch (err){
                console.error("Erro ao atualizar status offline.", err.message);
            }
            console.log(`Usuário desconectado: ${socket.usuario.nome}`);
        });
    });
}