import express from 'express';
import multer from 'multer';
import {createServer} from 'http';
import {Server} from 'socket.io'
import cors from 'cors';
import dotenv from 'dotenv';
import ChatSocket from './src/sockets/ChatSocket.js';
import conectarDB from './src/config/db.js'

import path from 'path';
import { fileURLToPath } from 'url';

//Imports das rotas
import autenticacaoRoutes from './src/routes/autenticacao.js'
import agendamentosRoutes from './src/routes/agendamento.js'
import profissionaisRoutes from './src/routes/profissionais.js'
import transacoesRoutes from './src/routes/transacao.js'
import chatRoutes from './src/routes/chats.js'
import usuariosRoutes from './src/routes/usuarios.js'
import uploadsRoutes from './src/routes/upload.js'

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Rotas da aplicação
app.use('/api/auth',autenticacaoRoutes);
app.use('/api/profissionais', profissionaisRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/transacoes', transacoesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/upload', uploadsRoutes);

//Rota base
app.get('/', (req, res) =>{
    res.send('A API está funcionando!');
})

app.use((req, res, next) => {
    res.status(404).send('Not Found');
});


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