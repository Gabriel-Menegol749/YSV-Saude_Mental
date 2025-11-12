import Usuarios from "../models/Usuarios.js";
import Consulta from '../models/Consulta.js'

const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const duracao_Sessao = 50;

export const calcularSlotsDisponíveis = async (req, res) => {
    const { profissionalId } = req.params;
    const { dataInicio } = req.query;

    if(!dataInicio){
        return res.status(400).json({ mensagem: "A data de início da semana é obrigatório!"});
    }
    try{
        const profissional = await Usuarios.findById(profissionalId).select('infoProfissional.disponibilidade infoProfissional.valorConsulta');
        if (!profissional || profissional.tipoUsuario !== 'Profissional'){
            return res.status(404).json({ mensagem: "Profissional não encontrado!"});
        }
        const disponibilidade = profissional.infoProfissional.disponibilidade || [];
        const valorConsulta = profissional.infoProfissional.valorConsulta || 0;

        const dataInicial = new Date(dataInicio);
        dataInicial.setHours(0, 0, 0, 0)

        const dataFinal = new Date(dataInicial);
        dataFinal.setDate(dataInicial.getDate() + 7)

        const consultasOcupadas = await Consulta.find({
            ID_Profissional: ProfissionalID,
            dataHorario_Consulta: { $gte: dataInicial, $lt: dataFinal},
            statusConsulta: {$in: ['solicitada', 'confirmada']}
        }).select('dataHorario_Consulta');

        const slotsOcupados = new Set(consultasOcupadas.map(c => c.dataHorario_Consulta.toISOString()));
        const slotsDisponiveisPorDia = {};

        for (let i = 0; i < 7; i++){
            const dataAtual = new Date(dataInicial);
            dataAtual.setDate(dataInicial.getDate() + i);

            const diaDaSemana = diasDaSemana[dataAtual.getDay()];
            const disponibDia = disponibilidade.find(d => d.diaDaSemana === diaDaSemana);

            if(!disponibDia) continue;

            const { horarioInicio, horariofim} = disponibDia;

            let [hInicio] = horarioInicio.split(':').map(Number);
            const [hFim] = horarioFim.split(':').map(Number);

            slotsDisponiveisPorDia[diaDaSemana] = [];

            for (let hSlot = hInicio; hSlot < hFim; hSlot++){
                const horarioString = `${String(hSlot).padStart(2, '0')}: 00`;

                const dataHoraSlot = new Date(dataAtual);
                dataHoraSlot.setHours(hSlot, 0, 0, 0);

                if(!slotsOcupadosSet.has(dataHoraSlot.toISOString())){
                    slotsDisponiveisPorDia[diaDaSemana].push(horarioString);
                }
            }
        }
        res.status (200).json({
            slots: slotsDisponiveisPorDia,
            valorConsulta: valorConsulta,
            duracao_Sessao: duracao_Sessao
        });
        } catch (erro){
            console.error("Erro ao calcular slots: ", erro);
            res.status(500).json({ mensagem: "Erro no servidor ao buscar slots."})
        }
};

export const solicitarAgendamento = async (req, res) => {
    const ID_Cliente = req.usuario.id;
    const{ ID_Profissional, dataHorario_Consulta, tipoModalidade } = req.body;

    const dataHora = new Date(dataHorario_Consulta);
    const consultaExistente = await Consulta.findOne({
        ID_Profissional,
        dataHorario_Consulta: dataHora,
        statusConsulta: { $in: ['Solicitada', 'Confirmada'] }
    });

    if(consultaExistente){
        return res.status(409).json({ mensagem: "Este horário não está disponível."});
    }

    try{
        const profissional = await Usuarios.findById(ID_Profissional).select('infoProfissional.valorConsulta');
        if (!profissional){
            return res.status(404).json({ mensagem: 'Profissional não encontrado.'})
        }
        const valor_Consulta = profissional.infoProfissional.valorConsulta;

        const novaConsulta = new Consulta({
            ID_Cliente,
            ID_Profissional,
            dataHorario_Consulta: dataHora,
            valor_Consulta,
            statusPagamento: 'pendente',
            statusConsulta: 'solicitada',
            tipoModalidade,
            historicoAcoes: [{ acao: 'Solicitada', porUsuario: ID_CLiente }]
        })

        await novaConsulta.save();

        res.status(201).json({
            mensagem: 'Solicitação de agendamento enviada com sucesso!',
            consulta: novaConsulta
        });
    } catch (erro){
        console.error("Erro ao solicitar agendamneto: ", erro);
        res.status(500).json({ mensagem: "Erro interno no servidor."});
    };
};


export const gerenciarSolicitacao = async (req, res) => {
    const ID_Profissional = req.usuario.id;
    const { consultaId } = req.params;
    const { acao, novaDataHorario } = req.body;

    try{
        const consulta = await Consulta.findOne({_id: consultaId, ID_Profissional });
        
        if(!consulta){
            return res.status(404).json({ mensagem: "Consulta não encontrada"});
        }
        if (consulta.statusConsulta !== 'solicitada' && acao !== 'reagendar'){
            return res.status(400).json({ mensagem: `A consulta não está em estado de solicitação. Status atua: ${consulta.statusConsulta}`})
        }
        let novoStatus;
        let historicoAcao;

        switch(acao){
            case 'confirmar':
                novoStatus = 'confirmada';
                historicoAcao = 'Confirmada';
                {/*Assim que possível, aqui vamos gerar uma notificação para efetuar o pagamento da consulta, e somente liberar
                    para entrar na vídeochamada, na tela de agendamnetos, caso o status de pagamento for = Pago*/}
                break;
            case 'recusar':
                novoStatus = 'recusada';
                historicoAcao = 'Recusada';
                {/*Não sei se é aqui que temos que gerar as notificações*/}
                break;
            case 'reagendar':
                if(!novaDataHorario){
                    return  res.status(400).json({ mensagem: "Nova data e horário são obrigatórios para o agendamento."});
                }
                novoStatus = 'reagendamento_solicitado';
                historicoAcao = 'Reagendada';
                consulta.dataHorario_Consulta = new Date(novaDataHorario);
                break;
            default:
                return res.status(400).json({ mensagem: "Ação inválida." });
        }
        consulta.statusConsulta = novoStatus;
        consulta.historicoAcoes.push({ acao: historicoAcao, porUsuario: ID_Profissional });

        await consulta.save();

        res.status(200).json({ mensagem: `Consulta ${historicoAcao} com sucesso.`, consulta });
    } catch (erro) {
        console.error("Erro ao gerenciar solicitação:", erro);
        res.status(500).json({ mensagem: "Erro interno do servidor." });
    };
};

export const getSolicitacoes = async (req, res) => {
    const ID_Profissional = req.usuario.id;

    try{
        const solicitacoes = await Consulta.find({
            ID_Profissional,
            statusConsulta: { $in: ['solicitada', 'reagendamento_solicitado']}
        })
        .populate('ID_Cliente', 'nome fotoPerfil');

        res.status(200).json(solicitacoes);
    } catch (erro) {
        console.error("Erro ao buscar solicitações:", erro);
        res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
}