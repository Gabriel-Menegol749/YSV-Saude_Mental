import express from 'express';
import verificaToken from '../middlewares/verificaToken.js';
import {
    getSlotsDisponiveis,
    solicitarAgendamento,
    confirmarAgendamento,
    cancelarAgendamento,
    solicitarReagendamentoProfissional,
    solicitarReagendamentoCliente,
    clienteAceitaReagendamento,
    clienteRecusaReagendamento,
    finalizarConsulta,
    enviarFeedback,
    upsertDisponibilidade,
    deleteDisponibilidade,
    getAgendamentosCliente,
    getAgendamentosProfissional,

} from '../controllers/ControladorAgendamento.js';

const router = express.Router();

// Rotas de Agendamento
router.get('/:profissionalId/slots', getSlotsDisponiveis);
router.post('/', verificaToken, solicitarAgendamento);
router.put('/:id/confirmar', verificaToken, confirmarAgendamento);
router.put('/:id/cancelar', verificaToken, cancelarAgendamento);
router.put('/:id/solicitar-reagendamento-cliente', verificaToken, solicitarReagendamentoCliente);
router.put('/:id/solicitar-reagendamento', verificaToken, solicitarReagendamentoProfissional);
router.put('/:id/cliente-aceita-reagendamento', verificaToken, clienteAceitaReagendamento);
router.put('/:id/cliente-recusa-reagendamento', verificaToken, clienteRecusaReagendamento);
router.put('/:id/finalizar', verificaToken, finalizarConsulta);
router.put('/:id/feedback', verificaToken, enviarFeedback);

// Rotas de Disponibilidade (agora unificadas aqui)
router.post('/disponibilidade', verificaToken, upsertDisponibilidade);
router.delete('/disponibilidade/:modalidade', verificaToken, deleteDisponibilidade);

// Rotas para listar agendamentos
router.get('/cliente', verificaToken, getAgendamentosCliente);
router.get('/profissional', verificaToken, getAgendamentosProfissional);

export default router;
