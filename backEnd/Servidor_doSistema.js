// server.js
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
import zegoRoutes from './src/routes/zego.js';
import notificacoesRoutes from './src/routes/notificacoes.js'
import chatRoutes from './src/routes/chats.js';
import avaliacoesRoutes from './src/routes/avaliacoes.js';

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

// Middleware de autenticação para Socket.IO
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    console.log(`[BACKEND_SOCKET_AUTH] ${new Date().toISOString()} - Tentativa de conexão. Token recebido: ${token ? 'Sim' : 'Não'}`);
    if (!token) {
        console.error('[BACKEND_SOCKET_AUTH] Autenticação falhou: Token não fornecido.');
        return next(new Error('Autenticação falhou: Token não fornecido.'));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id || decoded._id; 
        if (!userId) {
            console.error('[BACKEND_SOCKET_AUTH] ID do usuário não encontrado no token decodificado.');
            return next(new Error('Autenticação falhou: ID do usuário ausente no token.'));
        }
        socket.data.usuario = { ...decoded, _id: userId }; // Garante que _id esteja presente
        next();
    } catch (err) {
        console.error(`[BACKEND_SOCKET_AUTH] Erro ao verificar token: ${err.message}`);
        return next(new Error('Autenticação falhou: Token inválido.'));
    }
});

io.on('connection', (socket) => {
    const userId = socket.data.usuario._id; 
    console.log(`[BACKEND_SOCKET] Usuário ${userId} conectado com socket ID: ${socket.id}`);

    // O usuário entra em uma sala com seu próprio ID para receber notificações e atualizações de conversa direcionadas
    socket.join(userId.toString()); 
    console.log(`[BACKEND_SOCKET] Usuário ${userId} entrou na sala pessoal: ${userId}`);

    socket.on('joinRoom', (roomId) => { // Pode ser userId ou conversaId
        console.log(`[BACKEND_SOCKET] Usuário ${userId} entrando na sala: ${roomId}`);
        socket.join(roomId);
    });

    socket.on('leaveRoom', (roomId) => {
        console.log(`[BACKEND_SOCKET] Usuário ${userId} saindo da sala: ${roomId}`);
        socket.leave(roomId);
    });

    socket.on('disconnect', () => {
        console.log(`[BACKEND_SOCKET] Usuário ${userId} desconectado. Socket ID: ${socket.id}`);
        // Não precisamos sair da sala pessoal aqui, pois o socket será destruído.
    });
});

// Middlewares Express
app.use(cors({
    origin: '*', // Mantido '*' conforme sua preferência
    credentials: true
}));
app.use(express.json());
app.use((req, res, next) => {
    next();
});

// Servir arquivos estáticos do frontend (seu build do Vite)
app.use(express.static(path.join(__dirname, '../frontEnd/dist')));
console.log(`[BACKEND_EXPRESS_STATIC] Servindo estáticos de: ${path.join(__dirname, '../frontEnd/dist')}`);

// Servir arquivos de upload (fotos de perfil, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log(`[BACKEND_EXPRESS_UPLOADS] Servindo uploads de: ${path.join(__dirname, 'uploads')}`);

// Rotas da aplicação
app.use('/api/auth', autenticacaoRoutes);
app.use('/api/profissionais', profissionaisRoutes);
app.use('/api/agendamentos', agendamentosRoutes(io));
app.use('/api/transacoes', transacoesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/upload', uploadsRoutes);
app.use('/api/zego', zegoRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/chat', chatRoutes(io));
app.use('/api/avaliacoes', avaliacoesRoutes);

app.use((req, res, next) => {
    if (res.headersSent) {
        return;
    }
    next();
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontEnd/dist/index.html'));
});

//Portas do servidor
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
