// backEnd/src/routes/usuarios.js
import express from "express";
import { getPerfil, editarPerfil, listarProfissionais, getMeuPerfil } from "../controllers/ControladorUsuarios.js";
import { listarPerfisSalvos, salvarPerfil, removerPerfilSalvo } from "../controllers/ControladorPerfisSalvos.js"
import verificaToken from '../middlewares/verificaToken.js';

const router = express.Router();

router.get('/PerfisSalvos', verificaToken, listarPerfisSalvos);
router.post('/PerfisSalvos', verificaToken, salvarPerfil);
router.delete('/PerfisSalvos/:perfilId', verificaToken, removerPerfilSalvo);

router.get("/perfil", verificaToken, getMeuPerfil);
router.put("/perfil", verificaToken, editarPerfil);

router.get("/", listarProfissionais);

router.get("/:id", getPerfil);

export default router;
