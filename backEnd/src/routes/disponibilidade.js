import { Router } from "express";
import { atualizarDisponibilidade, obterDisponibilidade } from "../controllers/ControladorDispHorario";
import verificaToken from "../middlewares/verificaToken";

const router = Router();

router.get('/:profissionalId', obterDisponibilidade);
router.put('/', verificaToken, atualizarDisponibilidade);

export default router;