import express from 'express';
import verificaToken from '../middlewares/verificaToken.js';
import {
    upsertDisponibilidade,
    deleteDisponibilidade
} from '../controllers/ControladorDispHorario.js';

const router = express.Router();

router.route('/')
    .post(verificaToken, upsertDisponibilidade);

router.route('/:profissionalId/:modalidade')
    .delete(verificaToken, deleteDisponibilidade);

export default router;
