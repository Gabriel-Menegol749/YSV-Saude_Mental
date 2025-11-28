import express from 'express';
import verificaToken from '../middlewares/verificaToken.js';
import {
    getDisponibilidade,
    upsertDisponibilidade,
    deleteDisponibilidade
} from '../controllers/ControladorDispHorario.js';

const router = express.Router();

router.route('/:profissionalId')
    .get(getDisponibilidade);

router.route('/')
    .post(verificaToken, upsertDisponibilidade);

router.route('/:profissionalId/:modalidade')
    .delete(verificaToken, deleteDisponibilidade);

export default router;
