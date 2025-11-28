import Disponibilidade from "../models/DisponibilidadeHorarios.js";
import Consulta from "../models/Consulta.js";
import Usuario from "../models/Usuarios.js";
import { startOfWeek, addDays, format, parseISO, isWithinInterval, setHours, setMinutes, setSeconds, isAfter, isBefore, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const calcularSlotsDisponíveis = async (req, res) => {
    try {
        const { profissionalId } = req.params;
        const { dataInicio, modalidade } = req.query;

        if (!profissionalId || !dataInicio || !modalidade) {
            return res.status(400).json({ mensagem: "ID do profissional, data de início e modalidade são obrigatórios." });
        }

        const inicioSemana = startOfWeek(parseISO(dataInicio), { weekStartsOn: 1 });
        const fimSemana = addDays(inicioSemana, 6);

        const profissional = await Usuario.findById(profissionalId).select('infoProfissional.valorConsulta infoProfissional.duracaoConsulta');
        if (!profissional || !profissional.infoProfissional) {
            return res.status(404).json({ mensagem: "Informações do profissional não encontradas." });
        }
        const valorConsulta = profissional.infoProfissional.valorConsulta || 0;
        const duracaoSessao = profissional.infoProfissional.duracaoConsulta || 60;

        const disponibilidades = await Disponibilidade.find({
            profissionalId,
            modalidade
        });

        if (!disponibilidades || disponibilidades.length === 0) {
            return res.status(200).json({
                slotsPorDia: {},
                valorConsulta,
                duracao_Sessao: duracaoSessao,
                mensagem: "Profissional não possui disponibilidade configurada para esta modalidade."
            });
        }

        const agendamentosExistentes = await Consulta.find({
            ID_Profissional: profissionalId,
            dataHorario_Consulta: {
                $gte: inicioSemana,
                $lte: fimSemana
            },
            statusConsulta: { $in: ['solicitada', 'confirmada', 'reagendamento_solicitado'] }
        });

        const slotsPorDia = {};

        for (let i = 0; i < 7; i++) {
            const dataAtual = addDays(inicioSemana, i);
            const nomeDiaSemana = format(dataAtual, 'EEEE', { locale: ptBR });
            const nomeDiaSemanaCapitalizado = nomeDiaSemana.charAt(0).toUpperCase() + nomeDiaSemana.slice(1);

            slotsPorDia[nomeDiaSemanaCapitalizado] = [];

            const disponibilidadesDoDia = disponibilidades.flatMap(disp =>
                disp.dias.filter(d => d.diaSemana === nomeDiaSemanaCapitalizado)
            );

            const excecoesDoDia = disponibilidades.flatMap(disp =>
                disp.excecoes.filter(exc => format(exc.data, 'yyyy-MM-dd') === format(dataAtual, 'yyyy-MM-dd'))
            );

            let blocosDeHorarioDisponivel = [];

            disponibilidadesDoDia.forEach(dispDia => {
                dispDia.horarios.forEach(bloco => {
                    const inicio = setSeconds(setMinutes(setHours(dataAtual, parseInt(bloco.horaInicio.split(':')[0])), parseInt(bloco.horaInicio.split(':')[1])), 0);
                    const fim = setSeconds(setMinutes(setHours(dataAtual, parseInt(bloco.horaFim.split(':')[0])), parseInt(bloco.horaFim.split(':')[1])), 0);
                    blocosDeHorarioDisponivel.push({ inicio, fim });
                });
            });

            excecoesDoDia.forEach(excecao => {
                if (excecao.tipo === 'indisponivel') {
                    if (excecao.bloquearDiaInteiro) {
                        blocosDeHorarioDisponivel = [];
                    } else if (excecao.horarios && excecao.horarios.length > 0) {
                        excecao.horarios.forEach(blocoExc => {
                            const inicioExc = setSeconds(setMinutes(setHours(dataAtual, parseInt(blocoExc.horaInicio.split(':')[0])), parseInt(blocoExc.horaInicio.split(':')[1])), 0);
                            const fimExc = setSeconds(setMinutes(setHours(dataAtual, parseInt(blocoExc.horaFim.split(':')[0])), parseInt(blocoExc.horaFim.split(':')[1])), 0);
                            blocosDeHorarioDisponivel = blocosDeHorarioDisponivel.flatMap(blocoDisp => {
                                if (isAfter(blocoDisp.inicio, fimExc) || isBefore(blocoDisp.fim, inicioExc)) {
                                    return [blocoDisp];
                                } else {
                                    const novosBlocos = [];
                                    if (isBefore(blocoDisp.inicio, inicioExc)) {
                                        novosBlocos.push({ inicio: blocoDisp.inicio, fim: inicioExc });
                                    }
                                    if (isAfter(blocoDisp.fim, fimExc)) {
                                        novosBlocos.push({ inicio: fimExc, fim: blocoDisp.fim });
                                    }
                                    return novosBlocos;
                                }
                            });
                        });
                    }
                } else if (excecao.tipo === 'disponivel' && excecao.horarios && excecao.horarios.length > 0) {
                    excecao.horarios.forEach(blocoExc => {
                        const inicio = setSeconds(setMinutes(setHours(dataAtual, parseInt(blocoExc.horaInicio.split(':')[0])), parseInt(blocoExc.horaInicio.split(':')[1])), 0);
                        const fim = setSeconds(setMinutes(setHours(dataAtual, parseInt(blocoExc.horaFim.split(':')[0])), parseInt(blocoExc.horaFim.split(':')[1])), 0);
                        blocosDeHorarioDisponivel.push({ inicio, fim });
                    });
                }
            });

            blocosDeHorarioDisponivel.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());

            let mergedBlocks = [];
            if (blocosDeHorarioDisponivel.length > 0) {
                mergedBlocks.push(blocosDeHorarioDisponivel[0]);
                for (let j = 1; j < blocosDeHorarioDisponivel.length; j++) {
                    const current = blocosDeHorarioDisponivel[j];
                    const lastMerged = mergedBlocks[mergedBlocks.length - 1];
                    if (isBefore(current.inicio, lastMerged.fim) || current.inicio.getTime() === lastMerged.fim.getTime()) {
                        lastMerged.fim = isAfter(current.fim, lastMerged.fim) ? current.fim : lastMerged.fim;
                    } else {
                        mergedBlocks.push(current);
                    }
                }
            }
            blocosDeHorarioDisponivel = mergedBlocks;

            blocosDeHorarioDisponivel.forEach(bloco => {
                let currentSlotStart = bloco.inicio;
                while (isBefore(addMinutes(currentSlotStart, duracaoSessao), addMinutes(bloco.fim, 1))) {
                    const slotEnd = addMinutes(currentSlotStart, duracaoSessao);
                    const isSlotOcupado = agendamentosExistentes.some(agendamento => {
                        const agendamentoInicio = agendamento.dataHorario_Consulta;
                        const agendamentoFim = addMinutes(agendamentoInicio, duracaoSessao);
                        return (
                            isWithinInterval(currentSlotStart, { start: agendamentoInicio, end: addMinutes(agendamentoFim, -1) }) ||
                            isWithinInterval(addMinutes(slotEnd, -1), { start: agendamentoInicio, end: agendamentoFim }) ||
                            (isBefore(currentSlotStart, agendamentoInicio) && isAfter(slotEnd, agendamentoFim))
                        );
                    });
                    if (!isSlotOcupado) {
                        slotsPorDia[nomeDiaSemanaCapitalizado].push(format(currentSlotStart, 'HH:mm'));
                    }
                    currentSlotStart = addMinutes(currentSlotStart, duracaoSessao);
                }
            });
        }

        res.status(200).json({
            slotsPorDia,
            valorConsulta,
            duracao_Sessao: duracaoSessao
        });
    } catch (error) {
        console.error("Erro ao calcular slots disponíveis:", error);
        res.status(500).json({ mensagem: "Erro interno ao calcular slots disponíveis." });
    }
};

export const solicitarAgendamento = async (req, res) => {
    try {
        const { ID_Profissional, dataHorario_Consulta, tipoModalidade } = req.body;
        const ID_Cliente = req.usuario.id;

        const profissional = await Usuario.findById(ID_Profissional).select('infoProfissional.valorConsulta infoProfissional.duracaoConsulta');
        if (!profissional || !profissional.infoProfissional) {
            return res.status(404).json({ mensagem: "Informações do profissional não encontradas para agendamento." });
        }
        const valorConsulta = profissional.infoProfissional.valorConsulta || 0;
        const duracaoSessao = profissional.infoProfissional.duracaoConsulta || 60;

        const dataInicioConsulta = parseISO(dataHorario_Consulta);
        const dataFimConsulta = addMinutes(dataInicioConsulta, duracaoSessao);

        const novaConsulta = new Consulta({
            ID_Cliente,
            ID_Profissional,
            dataHorario_Consulta: dataInicioConsulta,
            valor_Consulta: valorConsulta,
            statusPagamento: 'pendente',
            statusConsulta: 'solicitada',
            tipoModalidade,
            historicoAcoes: [{ acao: 'Solicitada', porUsuario: ID_Cliente }]
        });

        await novaConsulta.save();

        res.status(201).json({ mensagem: "Solicitação de agendamento enviada com sucesso!", consulta: novaConsulta });

    } catch (error) {
        console.error("Erro ao solicitar agendamento:", error);
        res.status(500).json({ mensagem: "Erro interno ao solicitar agendamento." });
    }
};

export const getSolicitacoes = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const usuarioLogado = await Usuario.findById(usuarioId).select('tipoUsuario');

        if (!usuarioLogado) {
            return res.status(404).json({ mensagem: "Usuário não encontrado." });
        }

        let query = {};
        if (usuarioLogado.tipoUsuario === 'Profissional') {
            query.ID_Profissional = usuarioId;
        }
        else if (usuarioLogado.tipoUsuario === 'Cliente') {
            query.ID_Cliente = usuarioId;
        } else {
            return res.status(403).json({ mensagem: "Tipo de usuário não autorizado para ver solicitações." });
        }

        const solicitacoes = await Consulta.find(query)
            .populate('ID_Cliente', 'nome fotoPerfil')
            .populate('ID_Profissional', 'nome fotoPerfil infoProfissional.profissao')
            .sort({ dataHorario_Consulta: 1 });

        res.status(200).json(solicitacoes);

    } catch (error) {
        console.error("Erro ao obter solicitações:", error);
        res.status(500).json({ mensagem: "Erro interno ao obter solicitações." });
    }
};

export const gerenciarSolicitacao = async (req, res) => {
    try {
        const { consultaId } = req.params;
        const { acao } = req.body;
        const usuarioId = req.usuario.id;

        const consulta = await Consulta.findById(consultaId);

        if (!consulta) {
            return res.status(404).json({ mensagem: "Consulta não encontrada." });
        }

        const usuarioLogado = await Usuario.findById(usuarioId).select('tipoUsuario');
        if (!usuarioLogado) {
            return res.status(404).json({ mensagem: "Usuário logado não encontrado." });
        }

        let mensagem = "";
        let novoStatusConsulta = consulta.statusConsulta;
        let novoStatusPagamento = consulta.statusPagamento;
        let acaoHistorico = "";

        switch (acao) {
            case 'confirmar':
                if (usuarioLogado.tipoUsuario !== 'Profissional' || consulta.ID_Profissional.toString() !== usuarioId) {
                    return res.status(403).json({ mensagem: "Apenas o profissional pode confirmar esta consulta." });
                }
                if (consulta.statusConsulta === 'solicitada' || consulta.statusConsulta === 'reagendamento_solicitado') {
                    novoStatusConsulta = 'confirmada';
                    acaoHistorico = 'Confirmada';
                    mensagem = "Consulta confirmada com sucesso!";
                } else {
                    return res.status(400).json({ mensagem: `Não é possível confirmar uma consulta com status '${consulta.statusConsulta}'.` });
                }
                break;

            case 'recusar':
                if (usuarioLogado.tipoUsuario !== 'Profissional' || consulta.ID_Profissional.toString() !== usuarioId) {
                    return res.status(403).json({ mensagem: "Apenas o profissional pode recusar esta consulta." });
                }
                if (consulta.statusConsulta === 'solicitada' || consulta.statusConsulta === 'reagendamento_solicitado') {
                    novoStatusConsulta = 'recusada';
                    acaoHistorico = 'Recusada';
                    mensagem = "Consulta recusada.";
                } else {
                    return res.status(400).json({ mensagem: `Não é possível recusar uma consulta com status '${consulta.statusConsulta}'.` });
                }
                break;

            case 'cancelar':
                if (consulta.ID_Profissional.toString() !== usuarioId && consulta.ID_Cliente.toString() !== usuarioId) {
                    return res.status(403).json({ mensagem: "Você não tem permissão para cancelar esta consulta." });
                }
                if (consulta.statusConsulta !== 'realizada' && consulta.statusConsulta !== 'cancelada' && consulta.statusConsulta !== 'recusada') {
                    novoStatusConsulta = 'cancelada';
                    novoStatusPagamento = 'cancelado';
                    acaoHistorico = 'Cancelada';
                    mensagem = "Consulta cancelada com sucesso.";
                } else {
                    return res.status(400).json({ mensagem: `Não é possível cancelar uma consulta com status '${consulta.statusConsulta}'.` });
                }
                break;

            default:
                return res.status(400).json({ mensagem: "Ação inválida." });
        }

        consulta.statusConsulta = novoStatusConsulta;
        consulta.statusPagamento = novoStatusPagamento;
        consulta.historicoAcoes.push({ acao: acaoHistorico, porUsuario: usuarioId, dataAcao: new Date() });
        await consulta.save();

        res.status(200).json({ mensagem, consulta });

    } catch (error) {
        console.error("Erro ao gerenciar solicitação:", error);
        res.status(500).json({ mensagem: "Erro interno ao gerenciar solicitação." });
    }
};
