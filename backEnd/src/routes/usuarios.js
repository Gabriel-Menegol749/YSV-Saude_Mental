import express from "express";
import { getPerfil, editarPerfil, listarProfissionais, getMeuPerfil } from "../controllers/ControladorUsuarios.js";
import { listarPerfisSalvos, salvarPerfil, removerPerfilSalvo } from "../controllers/ControladorPerfisSalvos.js"

import verificaToken from '../middlewares/verificaToken.js';

const router = express.Router();


router.get('/perfis-salvos', verificaToken, listarPerfisSalvos);
router.post('/perfis-salvos', verificaToken, salvarPerfil);
router.delete('/perfis-salvos/:perfilId', verificaToken, removerPerfilSalvo);

router.get("/perfil", verificaToken, getMeuPerfil);
router.put("/perfil", verificaToken, editarPerfil);

router.get("/", listarProfissionais);

router.get("/:id", getPerfil);


export default router;
