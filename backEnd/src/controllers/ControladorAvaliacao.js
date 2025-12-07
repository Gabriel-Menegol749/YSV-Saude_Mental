import Avaliacao from '../models/Avaliacao.js';
import Usuario from '../models/Usuarios.js';

const criarAvaliacao = async (req, res) => {
    const { profissionalId, nota, comentario, anonimo } = req.body;
    const clienteId = req.usuario._id;

    if (!profissionalId || !nota) {
        return res.status(400).json({ msg: 'Profissional ID e nota são obrigatórios.' });
    }
    if (nota < 1 || nota > 5) {
        return res.status(400).json({ msg: 'A nota deve ser entre 1 e 5.' });
    }

    try {
        const profissional = await Usuario.findById(profissionalId);
        if (!profissional || profissional.tipoUsuario !== 'Profissional') {
            return res.status(404).json({ msg: 'Profissional não encontrado.' });
        }

        const novaAvaliacao = new Avaliacao({
            profissional: profissionalId,
            cliente: clienteId,
            nota,
            comentario: comentario || '',
            anonimo: anonimo || false
        });

        await novaAvaliacao.save();
        res.status(201).json({ msg: 'Avaliação criada com sucesso!', avaliacao: novaAvaliacao });

    } catch (error) {
        console.error('Erro ao criar avaliação:', error);
        res.status(500).json({ msg: 'Erro no servidor ao criar avaliação.' });
    }
};

const getAvaliacoesProfissional = async (req, res) => {
    const { profissionalId } = req.params;

    try {
        const avaliacoes = await Avaliacao.find({ profissional: profissionalId })
            .populate('cliente', 'nome fotoPerfil') // Popula o cliente para pegar nome e foto
            .sort({ data: -1 }); // Ordena pelas mais recentes

        res.status(200).json(avaliacoes);

    } catch (error) {
        console.error('Erro ao buscar avaliações do profissional:', error);
        res.status(500).json({ msg: 'Erro no servidor ao buscar avaliações.' });
    }
};

const getMediaAvaliacoesProfissional = async (req, res) => {
    const { profissionalId } = req.params;

    try {
        const resultado = await Avaliacao.aggregate([
            { $match: { profissional: new mongoose.Types.ObjectId(profissionalId) } },
            {
                $group: {
                    _id: null,
                    media: { $avg: '$nota' },
                    total: { $sum: 1 }
                }
            }
        ]);

        if (resultado.length > 0) {
            res.status(200).json({
                media: parseFloat(resultado[0].media.toFixed(1)),
                total: resultado[0].total
            });
        } else {
            res.status(200).json({ media: 0, total: 0 });
        }

    } catch (error) {
        console.error('Erro ao calcular média de avaliações:', error);
        res.status(500).json({ msg: 'Erro no servidor ao calcular média de avaliações.' });
    }
};

export {
    criarAvaliacao,
    getAvaliacoesProfissional,
    getMediaAvaliacoesProfissional
};
