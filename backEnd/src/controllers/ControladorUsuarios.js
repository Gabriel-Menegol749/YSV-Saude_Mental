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
    let updateObject = {};

    ['nome', 'secoesDinamicas', 'fotoPerfil', 'descricao'].forEach(campo => {
      if (atualizacoes[campo] !== undefined) {
        updateObject[campo] = atualizacoes[campo];
      }
    });

    if (usuario.tipoUsuario === 'Profissional') {
      let infoProfissionalUpdates = {};

      if (atualizacoes.profissao !== undefined) infoProfissionalUpdates.profissao = atualizacoes.profissao;
      if (atualizacoes.crp !== undefined) infoProfissionalUpdates.crp = atualizacoes.crp;
      if (atualizacoes.atendimento !== undefined) {
          infoProfissionalUpdates.modalidadeDeAtendimento = Array.isArray(atualizacoes.atendimento)
                                                              ? atualizacoes.atendimento
                                                              : [atualizacoes.atendimento];
      }
      if (atualizacoes.valorConsulta !== undefined) infoProfissionalUpdates.valorConsulta = parseFloat(atualizacoes.valorConsulta);
      if (atualizacoes.duracaoConsulta !== undefined) infoProfissionalUpdates.duracaoConsulta = parseFloat(atualizacoes.duracaoConsulta);


      if (atualizacoes.enderecoConsultorio !== undefined) infoProfissionalUpdates.enderecoConsultorio = atualizacoes.enderecoConsultorio;

      //Especialidades
      if (atualizacoes.especialidades !== undefined) {
        infoProfissionalUpdates.especialidades = atualizacoes.especialidades;
      }
      //Certificados
      if (atualizacoes.certificados !== undefined) {
        infoProfissionalUpdates.certificados = atualizacoes.certificados
      }
      //Formações
      if (atualizacoes.formacoes !== undefined) {
         infoProfissionalUpdates.formacoes = atualizacoes.formacoes;
      }
      //Fotos do Consultório presencial
      if (atualizacoes.fotoConsultorio !== undefined) {
        infoProfissionalUpdates.fotosConsultorio = atualizacoes.fotoConsultorio;
      }
      if (Object.keys(infoProfissionalUpdates).length > 0) {
        updateObject['infoProfissional'] = infoProfissionalUpdates;
      }
    } else if (usuario.tipoUsuario === 'Cliente') {
      if (atualizacoes.resumoPessoal !== undefined) updateObject.descricao = atualizacoes.resumoPessoal;
    }
    // Salvar as alterações
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