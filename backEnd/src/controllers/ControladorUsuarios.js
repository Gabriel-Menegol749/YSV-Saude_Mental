import Usuario from "../models/Usuarios.js";

export const getPerfil = async (req, res) => {
    const {id} = req.params;

    try{
        const perfil = await Usuario.findById(id).select("-senha");
        if(!perfil){
            return res.status(404).json({ mensagem: "Perfil não encontrado."});
        }
        res.status(200).json(perfil);
    } catch(error){
        console.error("Erro ao buscar o perfil: ", error);
        res.status(500).json({ mensagem: "Erro interno ao buscar o perfil."});
    }
}

export const editarPerfil = async (req, res) => {
    const userId = req.usuario._id;
    const atualizacoes = req.body;

    try{
        const usuario = await Usuario.findById(userId);

        if(!usuario){
            return res.status(404).json({ mensagem: "Usuario não encontrado."});
        }

        //Atualizações de campos gerais na tela de perfil pessoal
        if (atualizacoes.nome) usuario.nome = atualizacoes.nome;
        if (atualizacoes.telefoneContato) usuario.telefoneContato = atualizacoes.telefoneContato;
        if (atualizacoes.genero) usuario.genero = atualizacoes.genero;
        if (atualizacoes.fotoPerfil) usuario.fotoPerfil = atualizacoes.fotoPerfil;

        if(usuario.tipoUsuario === 'Profissional' && atualizacoes.infoProfissional){
            usuario.infoProfissional = {
                ...usuario.infoProfissional.toObject(),
                ...atualizacoes.infoProfissional
            };
        }
        if(usuario.tipoUsuario === 'Cliente' && atualizacoes.infoCliente){
            usuario.infoCliente = {
                ...usuario.infoCliente.toObject(),
                ...atualizacoes.infoCliente
            }
        }
        await usuario.save();

        const perfilAtualizado = await Usuario.findById(userId).select("-senha");
        res.status(200).json({ mensagem: "Perfil atualizado com sucesso!", perfil: perfilAtualizado});
    } catch (erro) {
        console.error("Erro ao atualizar perfil:", erro);
        if(erro.code === 11000){
            return res.status(400).json({ mensagem: "Este e-mail já está sendo utilizado!"})
        }
        res.status(500).json({ mensagem: "Erro interno no servidor ao atualizar o perfil."});
    };
}

export const listarProfissionais = async (req, res) => {
    const { especialidade, localidade, valorMaximo, convenio, genero } = req.query;

    const filtrosMongoose = {};

    filtrosMongoose.tipoUsuario = 'Profissional';

    if (especialidade) {
        filtrosMongoose['infoProfissional.especialidades'] = { $in: [especialidade] };
    }

    if (localidade) {
        filtrosMongoose['infoProfissional.enderecoConsultorio'] = { $regex: localidade, $options: 'i' };
    }

    if (valorMaximo) {
        filtrosMongoose['infoProfissional.valorConsulta'] = { $lte: parseFloat(valorMaximo) };
    }

    if (convenio) {
        filtrosMongoose['infoProfissional.convenios'] = { $in: [convenio] };
    }

    if (genero) {
        filtrosMongoose.genero = genero;
    }

    try {
        const profissionais = await Usuario.find(filtrosMongoose).select('-senha');
        res.status(200).json(profissionais);
    } catch (erro) {
        console.error("Erro ao listar e filtrar profissionais:", erro);
        res.status(500).json({ mensagem: "Erro interno no servidor ao listar profissionais." });
    }
};

export const getMeuPerfil = async (req, res) => {
    const usuarioId = req.usuario._id;

    try{
        const usuario = await Usuario.findById(usuarioId).select('-senha');

        if (!usuario) {
            return res.status(404).json({ mensagem: 'Perfil do usuário logado não encontrado.' });
        }

        return res.status(200).json(usuario);
    } catch (error) {
        console.error("Erro ao buscar perfil logado:", error);
        return res.status(500).json({ mensagem: 'Erro interno ao carregar o seu perfil.' });
    }
}