import express from 'express';
import Chat from '../models/Mensagem.js';
import verificaToken from '../middlewares/verificaToken.js';

const router = express.Router();

router.post("/conversa", verificaToken, async (req, res) => {
    const { usuario2 } = req.body;
    const usuario1 = req.usuario.id;

    try{
        let chat = await Chat.findOne({
            participantes: { $all: [usuario1, usuario2] },
        });

        if(!chat){
            chat = new Chat({ participantes: [usuario1, usuario2] });
            await chat.save();
        }
        res.status(200).json(chat);
    } catch(err){
        console.error(err.message);
        res.status(500).send("Erro ao criar ou buscar conversa.");
    }
})
router.get('/conversa/:idConversa', verificaToken, async (req, res) =>{
    try{
        const conversa = await Chat.findById(req.params.idConversa).populate(
            "mensagens.remetente",
            "nome fotoPerfil"
        );

        if(!conversa) return res.status(404).json({ msg: "Conversa não encontrada!"})
        res.json(conversa.mensagens);

    } catch (err){
        console.error(err.message);
        res.status(500).json({ msg: "Erro ao buscar conversas."});
    }
});

router.get('/usuario/:idUsuario', verificaToken, async (req, res) =>{
    try{
        const idUsuario = req.params.idUsuario;
        const conversas = await Chat.find({
            participantes: idUsuario
        }).populate('participantes', 'nome fotoPerfil tipoUsuario');

        res.json(conversas);
    } catch(err){
        console.error(err.message);
        res.status(500).send('Erro no servidor.');
    }
});

export default router;