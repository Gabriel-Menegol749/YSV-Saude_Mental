import Disponibilidade from "../models/DisponibilidadeHorarios.js";
import Usuario from "../models/Usuarios.js";

export const obterDisponibilidade = async (req, res) => {
    try {
        const { profissionalId } = req.params;
        const { modalidade } = req.query;

        let query = { profissionalId };
        if (modalidade) {
            query.modalidade = modalidade;
        }

        const disponibilidades = await Disponibilidade.find(query);

        if (!disponibilidades || disponibilidades.length === 0) {
            return res.status(404).json({ mensagem: "Disponibilidade não encontrada para este profissional." });
        }
        res.status(200).json(disponibilidades);
    } catch (e) {
        console.error("Erro ao obter disponibilidade:", e);
        res.status(500).json({ mensagem: "Erro interno ao buscar disponibilidade." });
    }
};

export const atualizarDisponibilidade = async (req, res) => {
    try {
        const profissionalId = req.usuario.id;
        const { dias, modalidade, excecoes } = req.body;

        if (!modalidade || !['Online', 'Presencial', 'Híbrido'].includes(modalidade)) {
            return res.status(400).json({ mensagem: "Modalidade inválida ou não fornecida." });
        }

        const disponibilidadeAtualizada = await Disponibilidade.findOneAndUpdate(
            { profissionalId, modalidade },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
            mensagem: "Disponibilidade atualizada com sucesso!",
            disponibilidade: disponibilidadeAtualizada
        });

    } catch (e) {
        console.error("Erro ao atualizar disponibilidade:", e);
        res.status(500).json({ mensagem: "Erro interno ao atualizar disponibilidade." });
    }
};
