import express from 'express';
import Chat from '../models/Chats.js';
import Usuarios from '../models/Usuarios.js';

const router = express.Router();

router.post('/conversa', async (req, res) => {
    const { ID_participante1, ID_parcitipante2 } = req.body;

    try{
        let conversa = await Chat.findOne({
            participantes: { $all: [ID_participante1, ID_parcitipante2] }
        });
        if(conversa){
            return res.status(200).json({ msg: 'A conversa já existe!', conversa});
        }

        conversa = new Chat({
            participantes: [ID_participante1, ID_parcitipante2]
        });

        await conversa.save();

        res.status(201).json({ msg: 'Conversa criada com sucesso!', conversa});

    } catch(err){
        console.error(err.message);
        res.status(500).send('Erro no servidor.');
    }
})

router.get('/conversa/:idUsuario', async (req, res) =>{
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

router.get('mensagem/:idConversa', async (req, res) => {
    try{
        const conversa = await Chat.findById(req.params.idConversa);
        if(!conversa){
            return res.status(404).json({ msg: 'Conversa não encontrada.'});
        }

        res.json(conversa.mensagens);

    } catch(err){
        console.error(err.message);
        res.status(500).send('Erro no servidor.');
    }
});

export default router;