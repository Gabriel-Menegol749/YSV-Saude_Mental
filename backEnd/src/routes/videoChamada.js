import express from "express";
import verificaToken from "../middlewares/verificaToken.js";
import { gerarTokenZegoCloud } from "../controllers/ControladorVideoChamada.js";

const router = express.Router();

router.post("/token", verificaToken, gerarTokenZegoCloud);

export default router;
