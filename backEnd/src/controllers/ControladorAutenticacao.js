import Usuario from '../models/Usuarios.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registraUsuario = async (req, res) => {
    try {
        const { nome, email, senha, tipoUsuario, CRP, profissao } = req.body;

        const usuarioJaExiste = await Usuario.findOne({ email });
        if (usuarioJaExiste) {
            return res.status(400).json({ msg: 'Já existe uma conta com esse email!' });
        }
        const senhaHash = await bcrypt.hash(senha, 10);
        const novoUsuario = new Usuario({
            nome,
            email,
            senha: senhaHash,
            tipoUsuario,
            infoProfissional: tipoUsuario === "Profissional" && CRP ? { crp: CRP, profissao: profissao } : undefined,

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
                fotoPerfil: novoUsuario.fotoPerfil,
                ...(novoUsuario.tipoUsuario === "Profissional" && novoUsuario.infoProfissional
                    ? { profissao: novoUsuario.infoProfissional.profissao, crp: novoUsuario.infoProfissional.crp }
                    : {}),
            },
            token,
        });
    } catch (err) {
        console.error('Erro no registro do usuário:', err);
        res.status(500).json({ msg: 'Erro no servidor!' });
    }
};

export const loginUsuario = async (req, res) => {
    try {
        const { email, senha } = req.body;
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ mensagem: 'Credenciais inválidas.' });
        }
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(400).json({ mensagem: 'Credenciais inválidas.' });
        }
        const token = jwt.sign({ id: usuario._id, tipoUsuario: usuario.tipoUsuario }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const usuarioRetorno = {
            _id: usuario._id,
            nome: usuario.nome,
            email: usuario.email,
            tipoUsuario: usuario.tipoUsuario,
            fotoPerfil: usuario.fotoPerfil,
            ...(usuario.tipoUsuario === "Profissional" && usuario.infoProfissional
                ? { profissao: usuario.infoProfissional.profissao, crp: usuario.infoProfissional.crp }
                : {}),
        };
        res.status(200).json({ token, usuario: usuarioRetorno });
    } catch (err) {
        console.error('Erro no login do usuário:', err);
        res.status(500).json({ mensagem: 'Erro no servidor!' });
    }
};
