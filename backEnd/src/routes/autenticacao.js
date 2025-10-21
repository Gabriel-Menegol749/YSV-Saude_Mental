import express from 'express';
import { registraUsuario, loginUsuario } from '../controllers/ControladorAutenticacao.js';

const router = express.Router();

router.post("/registro", registraUsuario);
router.post("/login", loginUsuario);

export default router;