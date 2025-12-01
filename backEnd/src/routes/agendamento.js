// src/routes/agendamento.js

import express from 'express';
import verificaToken from '../middlewares/verificaToken.js';
import {
    getSlotsDisponiveis,
    solicitarAgendamento,
    listarConsultasUsuario,
    aceitarAgendamento,
    reagendarAgendamento,
    recusarAgendamento,
    cancelarAgendamento,
    pagarConsulta,
    clienteAceitaReagendamento,
    clienteRecusaReagendamento,
    finalizarConsulta,
    enviarFeedback
} from '../controllers/ControladorAgendamento.js';

const router = express.Router();

router.get('/usuario', verificaToken, listarConsultasUsuario);
router.get('/slots/:profissionalId', getSlotsDisponiveis);
router.post('/', verificaToken, solicitarAgendamento);

// Rotas de ação do PROFISSIONAL
router.patch('/:id/aceitar', verificaToken, aceitarAgendamento);
router.patch('/:id/recusar', verificaToken, recusarAgendamento);
router.patch('/:id/reagendar', verificaToken, reagendarAgendamento);
router.patch('/:id/finalizar', verificaToken, finalizarConsulta);

// Rotas de ação do CLIENTE
router.patch('/:id/cancelar', verificaToken, cancelarAgendamento);
router.patch('/:id/pagar', verificaToken, pagarConsulta);
router.patch('/:id/reagendar/aceitar', verificaToken, clienteAceitaReagendamento);
router.patch('/:id/reagendar/recusar', verificaToken, clienteRecusaReagendamento);
router.post('/:id/feedback', verificaToken, enviarFeedback);

export default router;
