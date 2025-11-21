import express from "express";
import { getPerfil, editarPerfil, listarProfissionais, getMeuPerfil, processarUpload } from "../controllers/ControladorUsuarios.js";
import verificaToken from '../middlewares/verificaToken.js';
import upload from "../config/multer.js";

const router = express.Router();

router.get("/perfil", verificaToken, getMeuPerfil);
router.get("/:id", getPerfil);

router.post(
    "/upload",
    verificaToken,
    upload.fields([
        { name: 'fotoPerfilFile', maxCount: 1 },
        { name: 'videoSobreMimFile', maxCount: 1 },
        { name: 'fotoConsultorioFiles', maxCount: 10 }
    ]),
    processarUpload
);

router.put("/perfil",verificaToken, editarPerfil);

router.get("/", listarProfissionais);

export default router;