import Usuario from "../models/Usuarios.js";

export const getPerfil = async (req, res) => {
    const { id } = req.params;

    try {
        const perfil = await Usuario.findById(id).select("-senha");
        if (!perfil) {
            return res.status(404).json({ mensagem: "Perfil não encontrado." });
        }
        res.status(200).json(perfil);
    } catch (error) {
        console.error("Erro ao buscar o perfil: ", error);
        res.status(500).json({ mensagem: "Erro interno ao buscar o perfil." });
    }
}

export const editarPerfil = async (req, res) => {
    const userId = req.usuario.id;

    try {
        const usuario = await Usuario.findById(userId);
        if (!usuario) return res.status(404).json({ mensagem: "Usuário não encontrado." });

        const atualizacoes = req.body;
        let updateObject = {};

        ['nome', 'secoesDinamicas', 'fotoPerfil', 'descricao', 'videoSobreMim'].forEach(campo => {
            if (atualizacoes[campo] !== undefined) {
                updateObject[campo] = atualizacoes[campo];
            }
        });

        if (usuario.tipoUsuario === 'Profissional') {

            const camposProfissionaisSimples = [
                'profissao',
                'crp',
                'enderecoConsultorio',
                'especialidades',
                'formacoes',
                'fotoConsultorio'
            ];

            camposProfissionaisSimples.forEach(campo => {
                if (atualizacoes[campo] !== undefined) {
                    updateObject[`infoProfissional.${campo}`] = atualizacoes[campo];
                }
            });

            if (atualizacoes.modalidadeDeAtendimento !== undefined) {
                updateObject['infoProfissional.modalidadeDeAtendimento'] = Array.isArray(atualizacoes.modalidadeDeAtendimento)
                    ? atualizacoes.modalidadeDeAtendimento
                    : [atualizacoes.modalidadeDeAtendimento];
            }
            
            if (atualizacoes.valorConsulta !== undefined) {
                updateObject['infoProfissional.valorConsulta'] = parseFloat(atualizacoes.valorConsulta);
            }
            if (atualizacoes.duracaoConsulta !== undefined) {
                updateObject['infoProfissional.duracaoConsulta'] = parseFloat(atualizacoes.duracaoConsulta);
            }
        
        } else if (usuario.tipoUsuario === 'Cliente') {
            if (atualizacoes.resumoPessoal !== undefined) updateObject.descricao = atualizacoes.resumoPessoal;
        }

        const perfilAtualizado = await Usuario.findByIdAndUpdate(
            userId,
            { $set: updateObject },
            { new: true, runValidators: true }
        ).select("-senha");

        if (!perfilAtualizado) return res.status(404).json({ mensagem: "Falha ao salvar o usuário." });
        res.status(200).json(perfilAtualizado);
    } catch (erro) {
        console.error("Erro ao atualizar perfil:", erro);
        res.status(500).json({ mensagem: "Erro interno no servidor ao atualizar o perfil." });
    }
};

export const processarUpload = (req, res) => {
    const files = req.files;
    let filePath = null;
    if (files.fotoPerfilFile) {
        filePath = files.fotoPerfilFile[0].path;
    } else if (files.videoSobreMimFile) {
        filePath = files.videoSobreMimFile[0].path;
    } else if (files.fotoConsultorioFiles) {
        filePath = files.fotoConsultorioFiles[0].path; 
    }

    if (!filePath) {
        return res.status(400).json({ mensagem: "Nenhum arquivo encontrado ou campo de upload não reconhecido." });
    }

    const fileUrl = `/${filePath.replace(/\\/g, "/")}`;

    return res.status(200).json({ url: fileUrl });
};

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

    try {
        const profissionais = await Usuario.find(filtrosMongoose).select('-senha');
        res.status(200).json(profissionais);
    } catch (erro) {
        console.error("Erro ao listar e filtrar profissionais:", erro);
        res.status(500).json({ mensagem: "Erro interno no servidor ao listar profissionais." });
    }
};

export const getMeuPerfil = async (req, res) => {
    const usuarioId = req.usuario.id;

    try {
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