import express from "express";
import Usuarios from "../models/Usuarios.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try{
        const { especialidade, localidade, valorMaximo} = req.query;
        const filtros = {
            tipoUsuario: 'Profissional'
        };

        if(especialidade){
            filtros['infoProfissional.especialidades'] = { $in: [new RegExp(especialidade, 'i')]};
        }
        if(localidade){
            filtros['infoProfissional.enderecoConsultorio'] = { $regex: new RegExp(localidade, 'i')};
        }

        if(valorMaximo && !isNaN(parseFloat(valorMaximo))){
            const maxValor = parseFloat(valorMaximo);
            filtros['infoProfissional.valorConsulta'] = {$lte: maxValor};
        }

        const profissionais = await Usuarios.find(filtros).select("-senha -infoCliente -__v -createdAt -updatedAt");

        if (profissionais.length === 0){
            return res.status(200).json({msg: "Nenhum profissional encontrado!", profissionais: []});
        }
        res.json(profissionais);
    } catch(err){
        console.error("Erro na busca de profissionais:", err);
        res.status(500).json({ msg: "Erro interno no servidor ao buscar profissionais."});
    }
})

export default router;