import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io'
import cors from 'cors';
import dotenv from 'dotenv';
import conectarDB from './src/config/db.js'
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

//Imports das rotas
import autenticacaoRoutes from './src/routes/autenticacao.js'
import agendamentosRoutes from './src/routes/agendamento.js'
import profissionaisRoutes from './src/routes/profissionais.js'
import transacoesRoutes from './src/routes/transacao.js'
import usuariosRoutes from './src/routes/usuarios.js'
import uploadsRoutes from './src/routes/upload.js'
import zegoRoutes from './src/routes/zego.js'
import videoChamadaRoutes from './src/routes/videoChamada.js';
import notificacoesRoutes from './src/routes/notificacoes.js'

//Variáveis de ambiente
dotenv.config();

//App express
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//conexão mongodb (config/db.js)
conectarDB();

//Servidor http e instalação do socket.io, pros chats em tempo real
const httpServer = createServer(app);

const permitirOrigens = [
    'http://localhost:5173',
    'https://ysv-saude-mental.onrender.com'
]

const io = new Server(httpServer, {
    cors: {
        origin: permitirOrigens,
        methods: ['GET', 'POST']
    }
})

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Autenticação falhou: Token não fornecido.'));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.usuario = decoded;
        next();
    } catch (err) {
        return next(new Error('Autenticação falhou: Token inválido.'));
    }
});

io.on('connection', (socket) => {
    console.log(`Usuário conectado via Socket.IO: ${socket.data.usuario.id}`);

    socket.on('joinRoom', (userId) => {
        socket.join(userId);
        console.log(`Usuário ${socket.data.usuario.id} entrou na sala: ${userId}`);
    });

    socket.on('disconnect', () => {
        console.log(`Usuário desconectado via Socket.IO: ${socket.data.usuario.id}`);
    });
});


//Middlewares -- futuramente trocar as origens, por mais segurança
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontEnd/dist')));

//Rotas da aplicação
app.use('/api/auth',autenticacaoRoutes);
app.use('/api/profissionais', profissionaisRoutes);
app.use('/api/agendamentos', agendamentosRoutes(io));
app.use('/api/transacoes', transacoesRoutes);
app.use('/api', videoChamadaRoutes);

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/upload', uploadsRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/zego', zegoRoutes);
app.use('/api/notificacoes', notificacoesRoutes);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontEnd/dist/index.html'));
});

//Portas do servidor
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));