import express from "express";
import Usuarios from "../models/Usuarios.js";
import verificaToken from "../middlewares/verificaToken.js"

const router = express.Router();

router.get("/perfil", verificaToken, async (req,res) => {
    try{
        const usuario = await Usuarios.findById(req.usuario.id).select("-senha");
        if(!usuario){
            return res.status(404).json({ msg: "Usuário não encontrado."});
        }
        res.json(usuario);
    } catch(err){
        console.error(err),
        res.status(500).json({ msg: "Erro ao buscar o perfil do Usuário"}
        )
    }
})

router.put("/perfil", verificaToken, async(req, res) => {
    const { telefoneContato, genero, fotoPerfil, infoProfissional, infoCliente } = req.body;
    try{
        const usuario = await Usuarios.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ msg: "Usuário não encontrado." });
        }

        if (telefoneContato !== undefined) usuario.telefoneContato = telefoneContato;
        if (genero !== undefined) usuario.genero = genero;
        if (fotoPerfil !== undefined) usuario.fotoPerfil = fotoPerfil;

        if (usuario.tipoUsuario === 'Profissional' && infoProfissional) {
            // Mescla os dados recebidos com os dados existentes
            usuario.infoProfissional = {
                ...usuario.infoProfissional,
                ...infoProfissional
            };
        }
        if (infoCliente) {
            usuario.infoCliente = {
                ...usuario.infoCliente,
                ...infoCliente
            };
        }
        await usuario.save();

        const perfilAtualizado = await Usuarios.findById(req.usuario.id).select("-senha");
        res.json({ msg: "Perfil atualizado com sucesso!", perfil: perfilAtualizado });
    } catch (err) {
        console.error(err);
        // Erro de validação ou do servidor
        res.status(400).json({ msg: "Falha ao salvar o perfil." });
    }
});

router.get("/", verificaToken, async (req,res) => {
    try{
        const usuarios = await Usuarios.find( {_id: { $ne: req.usuario.id } }).select("-senha");
        res.json(usuarios);
    }catch(err){
        console.error(err),
        res.status(500).json({ msg: "Erro ao buscar usuários"})
    }
});

export default router;