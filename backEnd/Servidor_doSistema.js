import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io'
import cors from 'cors';
import dotenv from 'dotenv';
import ChatSocket from './src/sockets/ChatSocket.js';
import conectarDB from './src/config/db.js'

//Imports das rotas
import autenticacaoRoutes from './src/routes/autenticacao.js'
import agendamentosRoutes from './src/routes/agendamento.js'
import profissionaisRoutes from './src/routes/profissionais.js'
import transacoesRoutes from './src/routes/transacao.js'
import chatRoutes from './src/routes/chats.js'

//Variáveis de ambiente
dotenv.config();

//conexão mongodb (config/db.js)
conectarDB();

//App express
const app = express();

//Middlewares
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

//Rotas da aplicação
app.use('/api/auth',autenticacaoRoutes);
app.use('/api/profissionais', profissionaisRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/transacoes', transacoesRoutes);
app.use('/api/chat', chatRoutes);

//Rota base
app.get('/', (req, res) =>{
    res.send('A API está funcionando!');
})

//Servidor http e instalação do socket.io, pros chats em tempo real
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173/',
        methods: ['GET', 'POST']
    }
})

ChatSocket(io);

//Portas do servidor
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));