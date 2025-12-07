import Usuario from "../models/Usuarios.js";

export const listarPerfisSalvos = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const usuario = await Usuario.findById(usuarioId)
            .populate({
                path: 'perfisSalvos',
                select: 'nome fotoPerfil infoProfissional.crp infoProfissional.profissao infoProfissional.valorConsulta infoProfissional.duracaoConsulta infoProfissional.modalidadeDeAtendimento' // ✅ ADICIONADO AQUI!
            })
            .select('perfisSalvos');

        if (!usuario) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
        }

        if (usuario.perfisSalvos && usuario.perfisSalvos.length > 0) {
        }

        res.status(200).json(usuario.perfisSalvos);
    } catch (error) {
        console.error('Erro ao listar perfis salvos:', error);
        res.status(500).json({ mensagem: 'Erro ao buscar perfis salvos.' });
    }
};

export const salvarPerfil = async (req, res) => {
    const clienteId = req.usuario.id; // ID do usuário logado (cliente)
    const { profissionalId } = req.body; // <--- AQUI: Espera profissionalId no corpo da requisição

    if (!profissionalId) {
        return res.status(400).json({ mensagem: 'ID do profissional é obrigatório para salvar.' });
    }

    try {
        const cliente = await Usuario.findById(clienteId);
        if (!cliente) {
            return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
        }

        // Adiciona o profissionalId se ainda não estiver na lista
        if (!cliente.perfisSalvos.includes(profissionalId)) {
            cliente.perfisSalvos.push(profissionalId);
            await cliente.save();
        }

        res.status(200).json({ mensagem: 'Profissional salvo com sucesso.', perfisSalvos: cliente.perfisSalvos });
    } catch (error) {
        console.error('Erro ao salvar profissional:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao salvar profissional.' });
    }
};

export const removerPerfilSalvo = async (req, res) => {
    const clienteId = req.usuario.id; // ID do usuário logado (cliente)
    const { perfilId } = req.params; // <--- AQUI: Espera perfilId nos parâmetros da URL

    if (!perfilId) {
        return res.status(400).json({ mensagem: 'ID do perfil é obrigatório para remover.' });
    }

    try {
        const cliente = await Usuario.findById(clienteId);
        if (!cliente) {
            return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
        }

        // Remove o profissionalId da lista
        cliente.perfisSalvos = cliente.perfisSalvos.filter(id => id.toString() !== perfilId.toString());
        await cliente.save();

        res.status(200).json({ mensagem: 'Profissional removido dos salvos com sucesso.', perfisSalvos: cliente.perfisSalvos });
    } catch (error) {
        console.error('Erro ao remover profissional salvo:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao remover profissional salvo.' });
    }
};

