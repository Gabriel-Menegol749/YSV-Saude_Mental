import Usuario from '../models/Usuarios.js';
import bcrypt, { hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registraUsuario = async (req, res) => {
    try{
        const { nome, email, senha , tipoUsuario, CRP } = req.body;

        const usuarioJaExiste = await Usuario.findOne({ email });
        if (usuarioJaExiste){
            return res.status(400).json({ msg: 'Já existe uma conta com esse email!' });
        }
        const senhaHash = await bcrypt.hash(senha, 10);

        const novoUsuario = new Usuario({
            nome, email, senha: senhaHash, tipoUsuario, infoProfissional: tipoUsuario === "Profissional" ? {crp: CRP } : {},
        });

        await novoUsuario.save();

        const token = jwt.sign(
            { id: novoUsuario._id, tipoUsuario: novoUsuario.tipoUsuario },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            msg: "Usuário registrado com Sucesso!",
            usuario: {
                id: novoUsuario._id,
                nome: novoUsuario.nome,
                email: novoUsuario.email,
                tipoUsuario: novoUsuario.tipoUsuario,
            }, token,
        });
    } catch (err) {
        console.error('Erro no registro do usuário:', err);
        res.status(500).json({ msg: 'Erro no servidor!'});
    }
}

export const loginUsuario = async (req, res) => {
    try{
        const {email, senha} = req.body;

        const usuario = await Usuario.findOne({ email });
        if(!usuario){
            return res.status(400).json({ msg: 'Usuário não Encontrado!'});
        }
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if(!senhaValida){
            return res.status(400).json({ msg: 'Senha Incorreta!'});
        }

        const token = jwt.sign(
            {id: usuario._id, tipoUsuario: usuario.tipoUsuario },
            process.env.JWT_SECRET,
            { expiresIn: "7d"}
        );
        res.json({
            msg: 'Login realizado com Sucesso!',
            usuario: {
                id: usuario._id,
                nome: usuario.nome,
                email: usuario.email,
                tipoUsuario: usuario.tipoUsuario,
            },
            token,
        });
    } catch (err){
        console.error("Erro no Login!", err);
        res.status(500).json({ msg: 'Erro no Servidor.'});
    }
};
