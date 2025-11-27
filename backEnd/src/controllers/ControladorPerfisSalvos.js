import Usuario from "../models/Usuarios.js";

export const listarPerfisSalvos = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const usuario = await Usuario.findById(usuarioId)
      .populate('perfisSalvos', '-senha')
      .select('perfisSalvos');

    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    res.status(200).json(usuario.perfisSalvos);
  } catch (error) {
    console.error('Erro ao listar perfis salvos:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar perfis salvos.' });
  }
};

export const salvarPerfil = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { perfilId } = req.body;

        if (!perfilId) {
            return res.status(400).json({ mensagem: 'ID do perfil é obrigatório.' });
        }

        const usuario = await Usuario.findById(usuarioId);

        if (!usuario) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
        }

        if (usuario.perfisSalvos.includes(perfilId)) {
            return res.status(400).json({ mensagem: 'Perfil já está salvo.' });
        }

        usuario.perfisSalvos.push(perfilId);
        await usuario.save();

        res.status(200).json({ mensagem: 'Perfil salvo com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        res.status(500).json({ mensagem: 'Erro ao salvar perfil.' });
    }
};

export const removerPerfilSalvo = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { perfilId } = req.params;

        const usuario = await Usuario.findById(usuarioId);

        if (!usuario) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
        }

        usuario.perfisSalvos = usuario.perfisSalvos.filter(
            id => id.toString() !== perfilId
        );

        await usuario.save();

        res.status(200).json({ mensagem: 'Perfil removido com sucesso!' });
    } catch (error) {
        console.error('Erro ao remover perfil salvo:', error);
        res.status(500).json({ mensagem: 'Erro ao remover perfil.' });
    }
};