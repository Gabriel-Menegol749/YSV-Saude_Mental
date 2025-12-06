// src/routes/chats.js
import express from 'express';
import {
    getConversasDoUsuario,
    getMensagensDaConversa,
    iniciarOuObterConversa,
    enviarMensagem,
    marcarMensagensComoLidas
} from '../controllers/ControladorMensagens.js';
import verificaToken from '../middlewares/verificaToken.js';

const chatRoutes = (io) => {
    const router = express.Router();

    router.use((req, res, next) => {
        req.io = io; // Anexa a instância do Socket.IO ao objeto req
        next();
    });

    router.get('/conversas', verificaToken, getConversasDoUsuario);
    router.get('/mensagens/:conversaId', verificaToken, getMensagensDaConversa);
    router.post('/iniciar', verificaToken, iniciarOuObterConversa);
    router.post('/mensagens', verificaToken, enviarMensagem);
    router.put('/mensagens/:conversaId/lida', verificaToken, marcarMensagensComoLidas);

    return router;
};

export default chatRoutes;
