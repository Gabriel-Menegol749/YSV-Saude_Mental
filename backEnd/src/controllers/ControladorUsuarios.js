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
  const userId = req.usuario.id;

  try {
    const usuario = await Usuario.findById(userId);
    if (!usuario) return res.status(404).json({ mensagem: "Usuário não encontrado." });

    const atualizacoes = req.body;

    // Campos gerais
    ['nome', 'telefoneContato', 'genero'].forEach(campo => {
      if (atualizacoes[campo] !== undefined) usuario[campo] = atualizacoes[campo];
    });

    // Inicializa infoProfissional/infoCliente
    if (usuario.tipoUsuario === 'Profissional') usuario.infoProfissional = usuario.infoProfissional || {};
    if (usuario.tipoUsuario === 'Cliente') usuario.infoCliente = usuario.infoCliente || {};

    // --- Sobre mim ---
    // Texto
    if (atualizacoes.textoSobreMim !== undefined) {
      if (usuario.tipoUsuario === 'Profissional') usuario.infoProfissional.textoSobreMim = atualizacoes.textoSobreMim;
      if (usuario.tipoUsuario === 'Cliente') usuario.infoCliente.textoSobreMim = atualizacoes.textoSobreMim;
    }

    // Vídeo
    if (req.files?.videoSobreMimFile?.[0]) {
      const videoPath = "/" + req.files.videoSobreMimFile[0].path;
      if (usuario.tipoUsuario === 'Profissional') usuario.infoProfissional.videoSobreMim = videoPath;
      if (usuario.tipoUsuario === 'Cliente') usuario.infoCliente.videoSobreMim = videoPath;
    }

    // Foto de perfil
    if (req.files?.fotoPerfilFile?.[0]) usuario.fotoPerfil = "/" + req.files.fotoPerfilFile[0].path;

    // Remoções explícitas
    if (atualizacoes.removerFotoPerfil === "true") usuario.fotoPerfil = null;
    if (atualizacoes.removerVideoSobreMim === "true") {
      if (usuario.tipoUsuario === 'Profissional') usuario.infoProfissional.videoSobreMim = null;
      if (usuario.tipoUsuario === 'Cliente') usuario.infoCliente.videoSobreMim = null;
    }

    await usuario.save();
    const perfilAtualizado = await Usuario.findById(userId).select("-senha");
    res.status(200).json({ mensagem: "Perfil atualizado com sucesso!", perfil: perfilAtualizado });

  } catch (erro) {
    console.error("Erro ao atualizar perfil:", erro);
    if (erro.code === 11000) {
      return res.status(400).json({ mensagem: "Este e-mail já está sendo utilizado!" });
    }
    res.status(500).json({ mensagem: "Erro interno no servidor ao atualizar o perfil." });
  }
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
    const usuarioId = req.usuario.id;

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