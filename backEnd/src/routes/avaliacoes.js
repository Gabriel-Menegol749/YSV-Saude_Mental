import express from 'express';
import {
    criarAvaliacao,
    getAvaliacoesProfissional,
    getMediaAvaliacoesProfissional
} from '../controllers/ControladorAvaliacao.js';
import verificaToken from '../middlewares/verificaToken.js'

const router = express.Router();

router.post('/', verificaToken, criarAvaliacao);

router.get('/:profissionalId', getAvaliacoesProfissional);
router.get('/media/:profissionalId', getMediaAvaliacoesProfissional);

export default router;
