import express from "express";
import { getPerfil, editarPerfil, listarProfissionais, getMeuPerfil } from "../controllers/ControladorUsuarios.js";
import verificaToken from '../middlewares/verificaToken.js';
import upload from "../config/multer.js";

const router = express.Router();

router.get("/perfil", verificaToken, getMeuPerfil);
router.get("/:id", getPerfil);

router.put(
    "/perfil",
    verificaToken,
    upload.fields([
        { name: "videoSobreMimFile", maxCount: 1 },
        { name: "fotoPerfilFile", maxCount: 1 },
        { name: "fotoConsultorioFiles", maxCount: 10 }
    ]),
    editarPerfil
);

router.get("/", listarProfissionais);

export default router;