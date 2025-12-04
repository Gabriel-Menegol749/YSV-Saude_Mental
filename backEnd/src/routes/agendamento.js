// src/routes/agendamento.js

import express from 'express'; // ✅ Mantenha esta importação no topo
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
    profissionalAceitaReagendamento,
    profissionalRecusaReagendamento,
    finalizarConsulta,
    enviarFeedback,
    upsertDisponibilidade,
    deleteDisponibilidade,
    getAgendamentosCliente,
    getAgendamentosProfissional,
    processarPagamentoSimples,
} from '../controllers/ControladorAgendamento.js';

export default function(ioInstance) {
    const router = express.Router(); // ✅ Agora 'express' está no escopo e 'express.Router()' funciona
    router.use((req, res, next) => {
        req.io = ioInstance;
        next();
    });

    // Rotas de Agendamento
    router.get('/:profissionalId/slots', getSlotsDisponiveis);
    router.post('/', verificaToken, solicitarAgendamento);
    router.put('/:id/confirmar', verificaToken, confirmarAgendamento);
    router.put('/:id/cancelar', verificaToken, cancelarAgendamento);
    router.put('/:id/solicitar-reagendamento-cliente', verificaToken, solicitarReagendamentoCliente);
    router.put('/:id/solicitar-reagendamento', verificaToken, solicitarReagendamentoProfissional);
    router.put('/:id/cliente-aceita-reagendamento', verificaToken, clienteAceitaReagendamento);
    router.put('/:id/cliente-recusa-reagendamento', verificaToken, clienteRecusaReagendamento);
    router.put('/:id/profissional-aceita-reagendamento', verificaToken, profissionalAceitaReagendamento);
    router.put('/:id/profissional-recusa-reagendamento', verificaToken, profissionalRecusaReagendamento);
    router.put('/:id/finalizar', verificaToken, finalizarConsulta);
    router.put('/:id/feedback', verificaToken, enviarFeedback);
    router.put('/:id/pagar', verificaToken, processarPagamentoSimples);

    // Rotas de Disponibilidade
    router.post('/disponibilidade', verificaToken, upsertDisponibilidade);
    router.delete('/disponibilidade/:modalidade', verificaToken, deleteDisponibilidade);

    // Rotas para listar agendamentos
    router.get('/cliente', verificaToken, getAgendamentosCliente);
    router.get('/profissional', verificaToken, getAgendamentosProfissional);

    return router;
}
