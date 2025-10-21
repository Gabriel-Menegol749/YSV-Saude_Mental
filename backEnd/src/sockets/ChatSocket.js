import Chat from '../models/Chats.js'
import jwt from 'jsonwebtoken';

export default function ChatSocket(io){

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if(!token) return next(new Error('Autenticação necessária'));

        try{
            const usuario = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = usuario;
            next();
        } catch(err){
            next(new Error('Token inválido'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Usuário conectado ${socket.id}`);

        socket.on('JoinChat', ({ chatID }) => {
            socket.join(chatID);
            console.log(`Usuário ${socket.id} se juntou ao chat ${chatID}`);
        });

        socket.on('sendMessage', async ({ chatID, conteudo }) => {
            try {
                const chat = await Chat.findById(chatID);
                if(!chat) return;

                const novaMensagem = {
                    remetente: socket.user.id,
                    conteudo,
                    timestamp: new Date()
                };

                chat.mensagens.push(novaMensagem);
                await chat.save();

                io.to(chatID).emit('messageRecieved', novaMensagem);
            } catch(err){
                console.error(err.message);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Usuário desconectado: ${socket.id}`)
        })
    })
}