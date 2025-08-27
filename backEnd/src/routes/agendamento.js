import express from 'express';
import Consulta from '../models/Consulta.js'
import Usuario from '../models/Usuarios.js'

const router = express.Router();

/////IMPORTANTE: FUTURAMENTE PERMITIR QUE ESSA FUNÇÃO SÓ POSSA SER REALIZADA CASO O USUÁRIO ESTIVER LOGADO

router.post('/solicitar', async(req, res) =>{
    const { ID_Cliente, ID_Profissional, dataHorario_Consulta} = req.body;

    try{
        const cliente = await Usuario.findById(ID_Cliente);
        const profissional = await Usuario.findById(ID_Profissional);

        if(!cliente || !profissional) {
            return res.status(404).json({ msg: 'Cliente ou Profissional não encontrado!'});
        }
        const novaConsulta = new Consulta({
            ID_Cliente,
            ID_Profissional,
            dataHorario_Consulta,
            statusConsulta: 'Agendada'
        });

        /////**IMPORTANTE: AQUI VAMOS ADICIONAR MAIS FUTURAMENTE A LÓGICA DE ENVIAx'R UMA NOTIFICAÇÃO CERTINHA */
        await novaConsulta.save();
        res.status(201).json({ msg: 'Solicitação de agendamento enviada com sucesso!', consulta: novaConsulta});
    } catch (err){
        console.error(err.message);
        res.status(500).send('Erro no servidor.');
    }

    router.put('responder/:id', async (req,res) => {
        const {acao} = req.body;
        try{
            const consulta = await Consulta.findById(req.params.id);
            if(!consulta){
                return res.status(404).json({msg: 'Agendamento não encontrado.'});
            }
            if( acao === 'aceitar'){
                consulta.statusConsulta = 'confirmada';
                await consulta.save();

                //futuramente adicionar funçãop de enviar notificação pro cliente
                res.json({msg: 'Agendamento aceito', consulta});
            } else if (acao === 'recusar'){
                consulta.statusConsulta = 'recusada';
                await consulta.save();

                res.json({msg: 'Agendamento recusado', consulta});
            } else {
                return res.status(400).json({msg: 'Ação inválida. Use "Aceitar" ou "Recusar".'});
            }
        } catch (err){
            console.error(err.message);
            res.status(500).send('Erro no servidor!');
        }
    });
});

export default router;