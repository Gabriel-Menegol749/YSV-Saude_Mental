import express from 'express';
import upload from '../config/multer.js';
import { processarUpload } from '../controllers/ControladorUsuarios.js';
import verificaToken from '../middlewares/verificaToken.js';

const router = express.Router() ;

router.post("/", verificaToken,
    upload.fields([
        { name: 'fotoPerfilFile', maxCount: 1 },
        { name: 'videoSobreMimFile', maxCount: 1 },
        { name: 'fotoConsultorioFiles', maxCount: 99 }
    ]),
    processarUpload
);

export default router;