import express from 'express';
import verificaToken from '../middlewares/verificaToken.js';
import {
    getSlotsDisponiveis,
    solicitarAgendamento
} from '../controllers/ControladorAgendamento.js';

const router = express.Router();

router.route('/slots/:profissionalId')
    .get(getSlotsDisponiveis);

router.route('/')
    .post(verificaToken, solicitarAgendamento);

export default router;
