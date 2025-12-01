import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io'
import cors from 'cors';
import dotenv from 'dotenv';
import ChatSocket from './src/sockets/ChatSocket.js';
import conectarDB from './src/config/db.js'
import jwt from 'jsonwebtoken';

//Imports das rotas
import autenticacaoRoutes from './src/routes/autenticacao.js'
import agendamentosRoutes from './src/routes/agendamento.js'
import disponibilidadeRoutes  from './src/routes/disponibilidade.js';
import profissionaisRoutes from './src/routes/profissionais.js'
import transacoesRoutes from './src/routes/transacao.js'
import chatRoutes from './src/routes/chats.js'
import usuariosRoutes from './src/routes/usuarios.js'
import uploadsRoutes from './src/routes/upload.js'
import zegoRoutes from './src/routes/zego.js'
import videoChamadaRoutes from './src/routes/videoChamada.js';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


//Variáveis de ambiente
dotenv.config();
//conexão mongodb (config/db.js)
conectarDB();

//App express
const app = express();

const permitirOrigens = [
    'http://localhost:5173',
    'https://ysv-saude-mental.onrender.com'
]

//Middlewares
app.use(cors({
    origin: (origin, callBack) => {
        if(!origin || permitirOrigens.includes(origin)){
            callBack(null, true);
        } else {
            callBack(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

//Linha relacionada ao upload do arquivo no render
app.use(express.static(path.join(__dirname, "../frontEnd/dist")));

//Rotas da aplicação
app.use('/api/auth',autenticacaoRoutes);
app.use('/api/profissionais', profissionaisRoutes);
app.use('/api/disponibilidade', disponibilidadeRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/transacoes', transacoesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', videoChamadaRoutes);

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/upload', uploadsRoutes);

app.use('/api/zego', zegoRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//Rota base
app.get('/', (req, res) =>{
    res.send('A API está funcionando!');
})

app.use((req, res, next) => {
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
        return next();
    }
    res.status(404).send('Not Found');
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, '../frontEnd/dist/index.html'))
})

//Servidor http e instalação do socket.io, pros chats em tempo real
const httpServer = createServer(app);
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
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.data.usuario = decoded;
        next();
    } catch (err) {
        return next(new Error('Autenticação falhou: Token inválido.'));
    }
});

io.on('connection', (socket) => {
    console.log(`Usuário conectado via Socket.IO: ${socket.data.usuario.id}`);

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`Usuário ${socket.data.usuario.id} entrou na sala: ${roomId}`);
    });

    socket.on('sendMessage', ({ roomId, conteudo }) => {
        const mensagem = {
            remetente: socket.data.usuario.id,
            conteudo,
            timestamp: new Date().toISOString(),
        };
        io.to(roomId).emit('receiveMessage', mensagem);
    });

    socket.on('disconnect', () => {
        console.log(`Usuário desconectado via Socket.IO: ${socket.data.usuario.id}`);
    });
});


//Portas do servidor
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));