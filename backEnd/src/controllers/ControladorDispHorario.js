import Disponibilidade from '../models/DisponibilidadeHorarios.js';
import Usuario from '../models/Usuarios.js';

export const getDisponibilidade = async (req, res) => {
  try {
    const { profissionalId } = req.params;
    const { modalidade } = req.query;

    console.log('getDisponibilidade – params:', { profissionalId, modalidade });

    if (!profissionalId || !modalidade) {
      return res.status(400).json({ mensagem: 'ID do profissional e modalidade são obrigatórios.' });
    }

    const disponibilidade = await Disponibilidade.findOne({ profissionalId, modalidade });

    console.log('getDisponibilidade – resultado do findOne:', disponibilidade);

    if (!disponibilidade) {
      return res.status(404).json({ mensagem: 'Configuração de disponibilidade não encontrada.' });
    }

    res.status(200).json(disponibilidade);
  } catch (error) {
    console.error("Erro ao buscar disponibilidade:", error);
    res.status(500).json({ mensagem: 'Erro no servidor ao buscar disponibilidade.' });
  }
};



export const upsertDisponibilidade = async (req, res) => {
    try {
        const { profissionalId, modalidade, dias, excecoes } = req.body;
        const usuarioLogadoId = req.usuario.id;

        if (!profissionalId || !modalidade || !dias) {
            return res.status(400).json({ mensagem: 'Todos os campos (profissionalId, modalidade, dias) são obrigatórios.' });
        }

        if (profissionalId !== usuarioLogadoId.toString()) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para configurar a disponibilidade de outro profissional.' });
        }

        const profissional = await Usuario.findById(profissionalId);
        if (!profissional || profissional.tipoUsuario !== 'Profissional') {
            return res.status(404).json({ mensagem: 'Profissional não encontrado ou tipo de usuário inválido.' });
        }

        const disponibilidade = await Disponibilidade.findOneAndUpdate(
            { profissionalId, modalidade },
            { dias, excecoes },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({ mensagem: 'Disponibilidade configurada com sucesso!', disponibilidade });

    } catch (error) {
        console.error("Erro ao configurar disponibilidade:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ mensagem: error.message });
        }
        if (error.code === 11000) {
            return res.status(409).json({ mensagem: 'Já existe uma configuração de disponibilidade para este profissional e modalidade.' });
        }
        res.status(500).json({ mensagem: 'Erro no servidor ao configurar disponibilidade.' });
    }
};

export const deleteDisponibilidade = async (req, res) => {
    try {
        const { profissionalId, modalidade } = req.params;
        const usuarioLogadoId = req.usuario.id;

        if (profissionalId !== usuarioLogadoId.toString()) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para deletar esta disponibilidade.' });
        }

        const result = await Disponibilidade.findOneAndDelete({ profissionalId, modalidade });

        if (!result) {
            return res.status(404).json({ mensagem: 'Configuração de disponibilidade não encontrada.' });
        }

        res.status(200).json({ mensagem: 'Configuração de disponibilidade deletada com sucesso.' });

    } catch (error) {
        console.error("Erro ao deletar disponibilidade:", error);
        res.status(500).json({ mensagem: 'Erro no servidor ao deletar disponibilidade.' });
    }
};
