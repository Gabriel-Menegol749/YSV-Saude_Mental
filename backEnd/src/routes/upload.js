import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs'
import verificaToken from '../middlewares/verificaToken.js';

const router = express.Router() ;

const storage   = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = req.body.tipo === 'perfil' ? 'perfil' : 'consultorio';
        const uploadPath = path.join(process.cwd(), 'uploads', folder);

        if(!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        cb(null, `${Date.now()}-${file.fieldname}${extension}`);
    }
})

const upload = multer({
    storage: storage,
})

router.post('/', verificaToken, upload.single('file'), (req, res) => {
    if(!req.file){
        return res.status(400).json({ error: "Nenhum arquivo de imagem enviado ou formato incorreto!"});
    }
    const folder = req.body.tipo === 'perfil' ? 'perfil' : 'consultorio';
    const fileUrl = `/uploads/${folder}/${req.file.filename}`;

    return res.status(200).json({
        url: fileUrl,
        message: 'Upload concluído!'
    });
});

export default router;