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
        let unsetObject = {};

        // Campos básicos
        ['nome', 'secoesDinamicas', 'fotoPerfil', 'descricao', 'videoSobreMim'].forEach(campo => {
            if (atualizacoes[campo] !== undefined) {
                if (atualizacoes[campo] === '' || atualizacoes[campo] === null) {
                    unsetObject[campo] = '';
                } else {
                    updateObject[campo] = atualizacoes[campo];
                }
            }
        });

        if (usuario.tipoUsuario === 'Profissional') {
            const camposProfissionaisSimples = [
                'profissao', 'crp', 'enderecoConsultorio', 'especialidades', 'formacoes'
            ];

            camposProfissionaisSimples.forEach(campo => {
                if (atualizacoes[campo] !== undefined) {
                    if (atualizacoes[campo] === '' || atualizacoes[campo] === null) {
                        unsetObject[`infoProfissional.${campo}`] = '';
                    } else {
                        updateObject[`infoProfissional.${campo}`] = atualizacoes[campo];
                    }
                }
            });

            if (atualizacoes.fotosConsultorio !== undefined) {
                const fotosValidas = Array.isArray(atualizacoes.fotosConsultorio)
                    ? atualizacoes.fotosConsultorio.filter(foto => foto && typeof foto === 'string')
                    : [];

                if (fotosValidas.length === 0) {
                    unsetObject['infoProfissional.fotosConsultorio'] = '';
                } else {
                    updateObject['infoProfissional.fotosConsultorio'] = fotosValidas;
                }
            }

            if (atualizacoes.modalidadeDeAtendimento !== undefined) {
                const modalidades = Array.isArray(atualizacoes.modalidadeDeAtendimento)
                    ? atualizacoes.modalidadeDeAtendimento
                    : [atualizacoes.modalidadeDeAtendimento];

                if (modalidades.length === 0 || (modalidades.length === 1 && !modalidades[0])) {
                    unsetObject['infoProfissional.modalidadeDeAtendimento'] = '';
                } else {
                    updateObject['infoProfissional.modalidadeDeAtendimento'] = modalidades;
                }
            }

            if (atualizacoes.valorConsulta !== undefined) {
                if (atualizacoes.valorConsulta === '' || atualizacoes.valorConsulta === null) {
                    unsetObject['infoProfissional.valorConsulta'] = '';
                } else {
                    updateObject['infoProfissional.valorConsulta'] = parseFloat(atualizacoes.valorConsulta);
                }
            }

            if (atualizacoes.duracaoConsulta !== undefined) {
                if (atualizacoes.duracaoConsulta === '' || atualizacoes.duracaoConsulta === null) {
                unsetObject['infoProfissional.duracaoConsulta'] = '';
                } else {
                    updateObject['infoProfissional.duracaoConsulta'] = parseInt(atualizacoes.duracaoConsulta);
                }
            }
        }

        const updateQuery = { $set: updateObject };
        if (Object.keys(unsetObject).length > 0) {
            updateQuery.$unset = unsetObject;
        }

        const perfilAtualizado = await Usuario.findByIdAndUpdate(
            userId,
            updateQuery,
            { new: true, runValidators: true }
        ).select('-senha');

        res.status(200).json(perfilAtualizado);

    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        res.status(500).json({ mensagem: "Erro interno no servidor ao atualizar o perfil." });
    }
};

export const processarUpload = (req, res) => {
    const files = req.files;
    if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({ mensagem: "Nenhum arquivo foi enviado." });
    }
    let result = {};

    if (files.fotoPerfilFile && files.fotoPerfilFile[0]) {
        const filePath = files.fotoPerfilFile[0].path.replace(/\\/g, "/");
        result.fotoPerfil = `/${filePath}`;
    }

    if (files.videoSobreMimFile && files.videoSobreMimFile[0]) {
        const filePath = files.videoSobreMimFile[0].path.replace(/\\/g, "/");
        result.videoSobreMim = `/${filePath}`;
    }

    if (files.fotoConsultorioFiles && files.fotoConsultorioFiles.length > 0) {
        result.fotosConsultorio = files.fotoConsultorioFiles.map(file =>
            `/${file.path.replace(/\\/g, "/")}`
        );
    }

    if (Object.keys(result).length === 0) {
        return res.status(400).json({ mensagem: "Nenhum arquivo válido encontrado." });
    }

    const responseData = result.fotosConsultorio
        ? { url: result.fotosConsultorio }
        : { url: result.fotoPerfil || result.videoSobreMim };

    return res.status(200).json(responseData);
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


