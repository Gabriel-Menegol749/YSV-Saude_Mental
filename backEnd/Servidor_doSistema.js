import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io'
import conectarDB from './src/config/db.js'
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
conectarDB();

//Imports das rotas
import autenticacaoRoutes from './src/routes/autenticacao.js'
import agendamentosRoutes from './src/routes/agendamento.js'
import profissionaisRoutes from './src/routes/profissionais.js'
import transacoesRoutes from './src/routes/transacao.js'
import chatRoutes from './src/routes/chats.js'
import Chat from './src/models/Chats.js'

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/auth',autenticacaoRoutes);
app.use('/api/profissionais', profissionaisRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/transacoes', transacoesRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) =>{
    res.send('A API está funcionando!');
})

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*', //eventualmente alterar isso daqui
        methods: ['GET', 'POST']
    }
})

io.on('connection', (socket) =>{
    console.log(`Usuário conectado ${socket.id}`);

    socket.on('joinChat', ({chatId}) => {
        socket.join(chatId);
        console.log(`Usuário ${socket.id} se juntou ao chat ${chatId}`);
    });

    socket.on('sendMessage', async ({ chatId, senderId, messageContent }) => {
        try {
            const chat = await Chat.findById(chatId);
            if(!chat){
                return
            }

            const newMessage = {
                ID_remetente: senderId,
                conteudo_mensagem: messageContent,
                data_envio: new Date()
            };
            chat.mensagens.push(newMessage);
            await chat.save();

            io.to(chatId).emit('messageReceived', newMessage);
        } catch(err){
            console.error(err.message);
        }
    });

    socket.on('disconnect', () =>{
        console.log(`Usuário desconectado! ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));