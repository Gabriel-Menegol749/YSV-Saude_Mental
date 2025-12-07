import express from 'express';
import verificaToken from '../middlewares/verificaToken.js'

const router = express.Router();

router.post('/token', verificaToken);

export default router;
