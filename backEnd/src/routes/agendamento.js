import express from 'express';

import { calcularSlotsDisponíveis, solicitarAgendamento, gerenciarSolicitacao, getSolicitacoes } from '../controllers/ControladorAgendamento.js';
import verificaToken from '../middlewares/verificaToken.js';

const router = express.Router();

router.get('/slots/:profissionalId', calcularSlotsDisponíveis);
router.post('/solicitar', verificaToken, solicitarAgendamento);
router.get('/solicitacoes', verificaToken, getSolicitacoes);
router.put('/gerenciar/:consultaId', verificaToken, gerenciarSolicitacao);

export default router;