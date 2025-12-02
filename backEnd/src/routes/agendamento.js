import express from 'express';
import verificaToken from '../middlewares/verificaToken.js'; // ✅ CORREÇÃO: Importando como default export
import {
    getSlotsDisponiveis,
    solicitarAgendamento,
    confirmarAgendamento,
    cancelarAgendamento,
    clienteAceitaReagendamento,
    clienteRecusaReagendamento,
    finalizarConsulta,
    enviarFeedback
} from '../controllers/ControladorAgendamento.js';


const router = express.Router();

// Rotas de Agendamento
router.get('/:profissionalId/slots', verificaToken, getSlotsDisponiveis); 
router.post('/', verificaToken, solicitarAgendamento);
router.put('/:id/confirmar', verificaToken, confirmarAgendamento);
router.put('/:id/cancelar', verificaToken, cancelarAgendamento);
router.put('/:id/cliente-aceita-reagendamento', verificaToken, clienteAceitaReagendamento);
router.put('/:id/cliente-recusa-reagendamento', verificaToken, clienteRecusaReagendamento);
router.put('/:id/finalizar', verificaToken, finalizarConsulta);
router.put('/:id/feedback', verificaToken, enviarFeedback);

export default router;
