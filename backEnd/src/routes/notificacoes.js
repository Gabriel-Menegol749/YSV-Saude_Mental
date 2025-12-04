import express from 'express';
import verificaToken from '../middlewares/verificaToken.js';
import Notificacao from '../models/Notificacao.js';

const router = express.Router();
router.get('/', verificaToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const notificacoes = await Notificacao.find({ usuarioId })
      .sort({ timestamp: -1 })
      .lean();

    res.json(notificacoes);
  } catch (err) {
    console.error('Erro ao buscar notificações:', err);
    res.status(500).json({ msg: 'Erro ao buscar notificações.' });
  }
});

router.put('/marcar-todas-como-lidas', verificaToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    await Notificacao.updateMany(
      { usuarioId, lida: false },
      { $set: { lida: true } }
    );

    res.json({ msg: 'Notificações marcadas como lidas.' });
  } catch (err) {
    console.error('Erro ao marcar notificações como lidas:', err);
    res.status(500).json({ msg: 'Erro ao marcar notificações como lidas.' });
  }
});

router.delete('/', verificaToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    await Notificacao.deleteMany({ usuarioId });
    res.json({ msg: 'Notificações apagadas.' });
  } catch (err) {
    console.error('Erro ao apagar notificações:', err);
    res.status(500).json({ msg: 'Erro ao apagar notificações.' });
  }
});

export default router;
