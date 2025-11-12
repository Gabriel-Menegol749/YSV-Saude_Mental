import DisponibilidadeHorarios from "../models/DisponibilidadeHorarios.js";
import Usuarios from "../models/Usuarios.js";

export const atualizarDisponibilidade = async (req, res) => {
    const profissionalId = req.usuario._id;

    try{
        const {dias} = req.body;

        const disponibilidadeAtualizada = await Disponibilidade.findOneAndUpdate(
            { profissionalId: profissionalId },
            { $set: { dias: dias } },
            { upsert: true, new: true, runValidators: true}
        );
        return res.status(200).json(disponibilidadeAtualizada);
    } catch (error){
        console.error("Erro ao atualizar disponibilidade: ", error);
        return res.status(500).json({ mensagem: 'Erro interno ao processar a disponibilidade de horário.'});
    }
}

export const obterDisponibilidade = async (req, res) => {
    const {profissionalId} = req.params;
    try{
        const disponibilidade = await Disponibilidade.findOne({ profissionalId: profissionalId});

        if (!disponibilidade) {
            return res.status(200).json({ dias: [] });
        }

        return res.status(200).json(disponibilidade);

    }catch (error) {
        console.error("Erro ao obter disponibilidade:", error);
        return res.status(500).json({ mensagem: 'Erro interno ao obter a disponibilidade.' });
    }
}