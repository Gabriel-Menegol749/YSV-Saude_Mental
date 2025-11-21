import express from "express";
import { getPerfil, editarPerfil, listarProfissionais, getMeuPerfil } from "../controllers/ControladorUsuarios.js";
import verificaToken from '../middlewares/verificaToken.js';

const router = express.Router();

router.get("/perfil", verificaToken, getMeuPerfil);
router.put("/perfil", verificaToken, editarPerfil);

router.get("/", listarProfissionais);

router.get("/:id", getPerfil);

export default router;
