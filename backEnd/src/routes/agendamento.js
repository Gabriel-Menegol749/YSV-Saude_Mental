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
    clienteRecusaReagendamento
} from '../controllers/ControladorAgendamento.js';

const router = express.Router();

router.get('/usuario', verificaToken, listarConsultasUsuario);
router.route('/slots/:profissionalId')
    .get(getSlotsDisponiveis);
router.route('/')
    .post(verificaToken, solicitarAgendamento);

// Rotas de ação do PROFISSIONAL
router.patch('/:id/aceitar', verificaToken, aceitarAgendamento);
router.patch('/:id/recusar', verificaToken, recusarAgendamento);
router.patch('/:id/reagendar', verificaToken, reagendarAgendamento);

// Rotas de ação do CLIENTE
router.patch('/:id/cancelar', verificaToken, cancelarAgendamento);
router.patch('/:id/pagar', verificaToken, pagarConsulta);
router.patch('/:id/reagendar/aceitar', verificaToken, clienteAceitaReagendamento);
router.patch('/:id/reagendar/recusar', verificaToken, clienteRecusaReagendamento);

export default router;
