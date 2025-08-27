import express from 'express';
import Transacao from '../models/Transacao.js';
import Consulta from '../models/Consulta.js';

const router = express.Router();

router.post('/criar', async (req, res) =>{
    const {ID_Usuario, ID_Consulta, formaPagamento} = req.body;
    try{
        const consulta = await Consulta.findById(ID_Consulta);
        if(!consulta || consulta.ID_Cliente.toString() !== ID_Usuario){
            return res.status(404).json({msg: 'Consulta não encontrada ou usuário não autorizado.'});
        }

        const novaTransacao = new Transacao({
            ID_Usuario,
            ID_Consulta,
            formaPagamento,
            statusPagamento: 'pendente'
        });

        await novaTransacao.save();

        res.status(201).json({ msg: 'Transação Criada com sucesso!', transacao: novaTransacao });

    } catch(err){
        console.error(err.message);
        res.status(500).send('Erro no servidor.');
    }
});

router.put('/confirmar/:id', async (req, res) =>{
    const { comprovante } = req.body;

    try{
        const transacao = await Transacao.findById(req.params.id);
        if(!transacao){
            return res.status(404).json({ msg: 'Transação não encontrada.'});
        }

        transacao.statusPagamento = 'pago';
        transacao.data_HorarioPagamento = Date.now();
        if(comprovante){
            transacao.comprovante = comprovante;
        }

        await transacao.save();

        const consulta = await Consulta.findById(transacao.ID_consulta);
        if(consulta){
            consulta.statusPagamento = 'pago';
            await consulta.save();
        }
        res.json({ msg: 'Pagamento confirmado com sucesso!', transacao });

    } catch(err){
        console.error(err.message);
        res.status(500).send('Erro no servidor.');
    }
});

export default router;