import multer from "multer";
import path from "path";
import fs from "fs";

const dirs = {
  video: "uploads/videos/",
  perfil: "uploads/fotosPerfil/",
  consultorio: "uploads/fotosConsultorio/"
};

Object.values(dirs).forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function getDestination(fieldName) {
  switch (fieldName) {
    case "videoSobreMimFile":
      return dirs.video;
    case "fotoPerfilFile":
      return dirs.perfil;
    case "fotoConsultorioFiles":
      return dirs.consultorio;
    default:
      return "uploads/outros/";
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, getDestination(file.fieldname)),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const fileFilter = (req, file, cb) => {
  const allowed = ["videoSobreMimFile", "fotoPerfilFile", "fotoConsultorioFiles"];
  if (!allowed.includes(file.fieldname)) return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
  cb(null, true);
};

const upload = multer({ storage, fileFilter });
export default upload;
