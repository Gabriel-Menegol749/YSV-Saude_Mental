import express from 'express';
import Usuario from '../models/Usuarios';
import bcrypt from 'bcrypt';

const router = express.Router;

router.post('/registro',async (req, res) =>{
    const {nome, email, senha, tipoUsuario, informacoesProfissional} = req.body;
    try{
        let usuario = await Usuario.findOne({ email });
        if (usuario) {
            return res.status(500).json({ msg: 'Já existe um usuário com este e-mail!'});
        }

        usuario = new Usuario({
            nome,
            email,
            senha,
            tipoUsuario
        });

        if (tipoUsuario === 'Profissional' && informacoesProfissional){
            usuario.informacoesProfissional =  informacoesProfissional;
        }

        const salt = await bcrypt.genSalt(10);
        usuario.senha = await bcrypt.hash(senha, salt);

        await usuario.save();
        res.status(201).json({ msg: 'Usuário registrado com sucesso!'});
    } catch (err) {
        console.err(err.message);
        res.status(500).send('Erro no servidor!');
    }
});

router.post('/login', async (req, res) =>{
    const {email, senha} = req.body;
    try{
        const usuario = await Usuario.FindOne({ email });
        if(!usuario){
            return res.status(400).json({ msg: 'Email não encontrado!'})
        }

        res.json({ msg: 'Login realizado!', usuario: {id: usuario._id, nome: usuario.nome, tipo: usuario.tipoUsuario}});
    } catch (err){
        console.err(err.message);
        res.status(500).send('Erro no servidor.');
    }
})

export default router;