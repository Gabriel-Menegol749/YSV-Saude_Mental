// src/controllers/ControladorAgendamento.js

import Consulta from '../models/Consulta.js';
import Disponibilidade from '../models/DisponibilidadeHorarios.js'; // Importado para getSlotsDisponiveis
import Usuario from '../models/Usuarios.js';
import { format, addDays, addMinutes, isBefore, isSameDay, getDay, parseISO, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função auxiliar para gerar horários em um intervalo
const gerarHorariosIntervalo = (horaInicioStr, horaFimStr, duracaoSessaoMinutos) => {
    const horariosGerados = [];
    let inicio = new Date(`2000-01-01T${horaInicioStr}`);
    const fim = new Date(`2000-01-01T${horaFimStr}`);
    while (isBefore(inicio, fim)) {
        horariosGerados.push(format(inicio, 'HH:mm'));
        inicio = addMinutes(inicio, duracaoSessaoMinutos);
    }
    return horariosGerados;
};

// Função auxiliar para adicionar ao histórico
const adicionarHistorico = (consulta, acao, usuarioId) => {
    consulta.historicoAcoes.push({
        acao: acao,
        porUsuario: usuarioId,
        dataAcao: new Date()
    });
};

export const getSlotsDisponiveis = async (req, res) => {
    try {
        const { profissionalId } = req.params;
        const { dataInicio, modalidade } = req.query;

        if (!profissionalId || !dataInicio || !modalidade) {
            return res.status(400).json({ mensagem: 'ID do profissional, data de início e modalidade são obrigatórios.' });
        }

        const inicioSemana = parse(dataInicio, 'dd-MM-yyyy', new Date());
        if (isNaN(inicioSemana.getTime())) {
            console.error("Erro: dataInicio inválida após parse:", dataInicio);
            return res.status(400).json({ mensagem: 'Formato de data de início inválido. Use dd-MM-yyyy.' });
        }

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        // ✅ Usando DisponibilidadeHorarios.js
        const configDisponibilidade = await Disponibilidade.findOne({ profissionalId, modalidade });
        if (!configDisponibilidade) {
            return res.status(404).json({ mensagem: 'Configuração de disponibilidade não encontrada para esta modalidade.' });
        }
        console.log('Configuração de disponibilidade encontrada.');

        const profissional = await Usuario.findById(profissionalId).select('infoProfissional');
        if (!profissional || !profissional.infoProfissional) {
            console.error('Informações do profissional (valor/duração) não encontradas.');
            return res.status(404).json({ mensagem: 'Informações do profissional (valor/duração) não encontradas.' });
        }

        const valorConsulta = profissional.infoProfissional.valorConsulta || 0;
        const duracaoSessao = profissional.infoProfissional.duracaoConsulta || 50;
        console.log('Valor da consulta:', valorConsulta, 'Duração da sessão:', duracaoSessao);

        if (duracaoSessao <= 0) {
            console.error("Duração da sessão inválida:", duracaoSessao);
            return res.status(400).json({ mensagem: 'Duração da sessão deve ser maior que zero.' });
        }

        const slotsPorDia = {};
        const diasDaSemanaMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        for (let i = 0; i < 7; i++) {
            const dataAtual = addDays(inicioSemana, i);
            const dataAtualISO = format(dataAtual, 'yyyy-MM-dd');
            const nomeDiaSemanaBanco = diasDaSemanaMap[getDay(dataAtual)];

            if (isBefore(dataAtual, hoje) && !isSameDay(dataAtual, hoje)) {
                slotsPorDia[dataAtualISO] = [];
                console.log(`  Dia ${dataAtualISO} é passado, sem slots.`);
                continue;
            }

            const configDia = configDisponibilidade.dias.find(d => d.diaSemana === nomeDiaSemanaBanco);

            if (configDia && configDia.horarios.length > 0) {
                let horariosBaseDoDia = [];
                configDia.horarios.forEach(bloco => {
                    horariosBaseDoDia = horariosBaseDoDia.concat(
                        gerarHorariosIntervalo(bloco.horaInicio, bloco.horaFim, duracaoSessao)
                    );
                });

                const agendamentosDoDia = await Consulta.find({
                    profissionalId: profissionalId, // ✅ Usando profissionalId
                    data: {
                        $gte: new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate(), 0, 0, 0),
                        $lt: new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate(), 23, 59, 59, 999)
                    },
                    modalidade,
                    statusConsulta: { $in: ['solicitada', 'confirmada', 'reagendamento_solicitado'] }
                }).select('horario');

                const horariosOcupados = agendamentosDoDia.map(a => a.horario);

                const horariosDisponiveis = horariosBaseDoDia.filter(hora => {
                    const agora = new Date();
                    if (isSameDay(dataAtual, agora)) {
                        const [h, m] = hora.split(':').map(Number);
                        const slotDateTime = new Date();
                        slotDateTime.setFullYear(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate());
                        slotDateTime.setHours(h, m, 0, 0);
                        return isBefore(agora, slotDateTime);
                    }
                    return true;
                }).filter(hora => !horariosOcupados.includes(hora));

                slotsPorDia[dataAtualISO] = horariosDisponiveis;
            } else {
                slotsPorDia[dataAtualISO] = [];
            }
        }

        res.status(200).json({
            slotsPorDia,
            valorConsulta,
            duracao_Sessao: duracaoSessao
        });

    } catch (error) {
        console.error("Erro ao buscar slots disponíveis:", error);
        res.status(500).json({ mensagem: 'Erro no servidor ao buscar slots disponíveis.' });
    }
};

export const solicitarAgendamento = async (req, res) => {
    try {
        const { profissionalId, data, horario, modalidade, valor, duracao } = req.body;
        const clienteId = req.usuario.id;

        if (!profissionalId || !data || !horario || !modalidade || !valor || !duracao) {
            return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios para solicitar agendamento.' });
        }

        const profissional = await Usuario.findById(profissionalId);
        if (!profissional || profissional.tipoUsuario !== 'Profissional') {
            return res.status(404).json({ mensagem: 'Profissional não encontrado.' });
        }

        const dataConsultaObj = parseISO(data); // Converte a string de data para objeto Date

        // ✅ REINTRODUZIDO: Verificar se o slot já está ocupado
        const slotOcupado = await Consulta.findOne({
            profissionalId: profissionalId,
            data: dataConsultaObj,
            horario,
            statusConsulta: { $in: ['solicitada', 'confirmada', 'reagendamento_solicitado'] }
        });

        if (slotOcupado) {
            return res.status(409).json({ mensagem: 'Este horário já está ocupado ou solicitado.' });
        }

        const novaConsulta = new Consulta({
            clienteId,
            profissionalId,
            data: dataConsultaObj,
            horario,
            modalidade,
            valor,
            duracao,
            statusConsulta: 'solicitada',
            statusPagamento: 'pendente'
        });

        adicionarHistorico(novaConsulta, 'Solicitada', clienteId);

        await novaConsulta.save();
        res.status(201).json({ mensagem: 'Agendamento solicitado com sucesso!', consulta: novaConsulta });

    } catch (error) {
        console.error('Erro ao solicitar agendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao solicitar agendamento.' });
    }
};

export const listarConsultasUsuario = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const tipoUsuario = req.usuario.tipoUsuario;

        let consultas;
        if (tipoUsuario === 'Profissional') {
            consultas = await Consulta.find({ profissionalId: usuarioId }) // ✅ Usando profissionalId
                .populate('clienteId', 'nome fotoPerfil') // ✅ Usando clienteId e 'fotoPerfil' na raiz
                .populate('profissionalId', 'nome fotoPerfil infoProfissional.profissao infoProfissional.crp'); // ✅ Usando profissionalId e corrigindo typo
        } else { // Cliente
            consultas = await Consulta.find({ clienteId: usuarioId }) // ✅ Usando clienteId
                .populate('profissionalId', 'nome fotoPerfil infoProfissional.profissao infoProfissional.crp') // ✅ Usando profissionalId e corrigindo typo
                .populate('clienteId', 'nome fotoPerfil'); // ✅ Usando clienteId e 'fotoPerfil' na raiz
        }

        // Separa as consultas por status para o frontend
        const solicitacoes = consultas.filter(c => c.statusConsulta === 'solicitada');
        const consultasConfirmadas = consultas.filter(c =>
            c.statusConsulta === 'confirmada' ||
            c.statusConsulta === 'reagendamento_solicitado' || // Profissional propôs reagendamento, cliente precisa aceitar
            c.statusConsulta === 'realizada' // Consultas realizadas, mas ainda não finalizadas
        );
        const consultasRecusadasCanceladas = consultas.filter(c =>
            c.statusConsulta === 'recusada' ||
            c.statusConsulta === 'cancelada' ||
            c.statusConsulta === 'finalizada' // Consultas finalizadas
        );

        // ✅ CORREÇÃO: res.json() deve receber um único objeto
        res.status(200).json({ solicitacoes, consultasConfirmadas, consultasRecusadasCanceladas });

    } catch (error) {
        console.error("Erro ao listar consultas do usuário:", error);
        res.status(500).json({ mensagem: 'Erro no servidor ao listar consultas.' });
    }
};

export const aceitarAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const profissionalId = req.usuario.id;

        const consulta = await Consulta.findOneAndUpdate(
            { _id: id, profissionalId, statusConsulta: 'solicitada' }, // ✅ Usando profissionalId e statusConsulta
            { $set: { statusConsulta: 'confirmada' } }, // ✅ Usando statusConsulta
            { new: true }
        );

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Consulta não encontrada ou não pode ser aceita.' });
        }

        adicionarHistorico(consulta, 'Confirmada', profissionalId);
        await consulta.save();

        res.status(200).json({ mensagem: 'Agendamento aceito com sucesso!', consulta });

    } catch (error) {
        console.error("Erro ao aceitar agendamento:", error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao aceitar agendamento.' });
    }
};

export const recusarAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id;

        const consulta = await Consulta.findById(id);

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Consulta não encontrada.' });
        }

        const isProfissional = consulta.profissionalId.toString() === usuarioId.toString();
        const isCliente = consulta.clienteId.toString() === usuarioId.toString();

        if (!isProfissional && !isCliente) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para recusar/cancelar esta consulta.' });
        }

        if (isProfissional) {
            if (consulta.statusConsulta === 'solicitada' || consulta.statusConsulta === 'confirmada' || consulta.statusConsulta === 'reagendamento_solicitado') {
                consulta.statusConsulta = 'recusada';
                adicionarHistorico(consulta, 'Recusada', usuarioId);
            } else {
                return res.status(400).json({ mensagem: 'Não é possível recusar esta consulta neste status.' });
            }
        } else if (isCliente) {
            if (consulta.statusConsulta === 'confirmada' || consulta.statusConsulta === 'solicitada') {
                consulta.statusConsulta = 'cancelada';
                adicionarHistorico(consulta, 'Cancelada', usuarioId);
            } else if (consulta.statusConsulta === 'reagendamento_solicitado') {
                consulta.statusConsulta = 'recusada'; // Cliente recusa reagendamento
                adicionarHistorico(consulta, 'Reagendamento Recusado pelo Cliente', usuarioId);
            } else {
                return res.status(400).json({ mensagem: 'Não é possível cancelar esta consulta neste status.' });
            }
        }

        await consulta.save();
        res.status(200).json({ mensagem: 'Consulta atualizada com sucesso!', consulta });

    } catch (error) {
        console.error('Erro ao recusar agendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao recusar agendamento.' });
    }
};

export const reagendarAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const profissionalId = req.usuario.id;
        const { novaData, novoHorario } = req.body;

        if (!novaData || !novoHorario) {
            return res.status(400).json({ mensagem: 'Nova data e novo horário são obrigatórios para reagendamento.' });
        }

        const dataHoraReagendamento = parse(`${novaData} ${novoHorario}`, 'yyyy-MM-dd HH:mm', new Date());
        if (isNaN(dataHoraReagendamento.getTime())) {
            return res.status(400).json({ mensagem: 'Formato de nova data ou novo horário inválido.' });
        }

        const slotOcupado = await Consulta.findOne({
            profissionalId: profissionalId,
            data: dataHoraReagendamento,
            horario: novoHorario,
            statusConsulta: { $in: ['solicitada', 'confirmada', 'reagendamento_solicitado'] },
            _id: { $ne: id }
        });

        if (slotOcupado) {
            return res.status(409).json({ mensagem: 'O novo horário sugerido já está ocupado.' });
        }

        const consulta = await Consulta.findOneAndUpdate(
            { _id: id, profissionalId, statusConsulta: { $in: ['solicitada', 'confirmada', 'paga'] } },
            {
                $set: {
                    data: dataHoraReagendamento, // ✅ Usando dataHoraReagendamento (objeto Date)
                    horario: novoHorario,
                    statusConsulta: 'reagendamento_solicitado'
                }
            },
            { new: true }
        );

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Consulta não encontrada ou não pode ser reagendada.' });
        }

        adicionarHistorico(consulta, `Reagendada para ${novaData} às ${novoHorario}`, profissionalId);
        await consulta.save();

        res.status(200).json({ mensagem: 'Proposta de reagendamento enviada com sucesso!', consulta });

    } catch (error) {
        console.error('Erro ao reagendar agendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao reagendar agendamento.' });
    }
};

export const cancelarAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const clienteId = req.usuario.id;

        const consulta = await Consulta.findOneAndUpdate(
            { _id: id, clienteId, statusConsulta: { $in: ['solicitada', 'confirmada', 'paga', 'reagendamento_solicitado'] } }, // ✅ Usando clienteId e statusConsulta
            { $set: { statusConsulta: 'cancelada', statusPagamento: 'cancelado' } }, // ✅ Usando statusConsulta
            { new: true }
        );

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Consulta não encontrada ou não pode ser cancelada.' });
        }

        adicionarHistorico(consulta, 'Cancelada', clienteId);
        await consulta.save();

        res.status(200).json({ mensagem: 'Agendamento cancelado com sucesso!', consulta });

    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao cancelar agendamento.' });
    }
};

export const pagarConsulta = async (req, res) => {
    try {
        const { id } = req.params;
        const clienteId = req.usuario.id;

        const consulta = await Consulta.findOneAndUpdate(
            { _id: id, clienteId, statusPagamento: 'pendente', statusConsulta: 'confirmada' }, // ✅ Usando clienteId e statusConsulta
            { $set: { statusPagamento: 'pago', link_Pagamento: 'PAGAMENTO_SIMULADO' } },
            { new: true }
        );

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado, já pago ou não pode ser pago neste momento.' });
        }

        adicionarHistorico(consulta, 'Paga', clienteId);
        await consulta.save();

        res.status(200).json({ mensagem: 'Pagamento registrado com sucesso!', consulta });

    } catch (error) {
        console.error('Erro ao pagar consulta:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao pagar consulta.' });
    }
};

export const clienteAceitaReagendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const clienteId = req.usuario.id;

        const consulta = await Consulta.findOneAndUpdate(
            { _id: id, clienteId, statusConsulta: 'reagendamento_solicitado' }, // ✅ Usando clienteId
            { $set: { statusConsulta: 'confirmada' } },
            { new: true }
        );

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Consulta não encontrada ou não está aguardando reagendamento do cliente.' });
        }

        adicionarHistorico(consulta, 'Reagendamento Aceito pelo Cliente', clienteId);
        await consulta.save();

        res.status(200).json({ mensagem: 'Reagendamento aceito com sucesso!', consulta });

    } catch (error) {
        console.error("Erro ao cliente aceitar reagendamento:", error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao aceitar reagendamento.' });
    }
};

export const clienteRecusaReagendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const clienteId = req.usuario.id;

        const consulta = await Consulta.findOneAndUpdate(
            { _id: id, clienteId, statusConsulta: 'reagendamento_solicitado' }, // ✅ Usando clienteId
            { $set: { statusConsulta: 'cancelada' } },
            { new: true }
        );

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Consulta não encontrada ou não está aguardando reagendamento do cliente.' });
        }

        adicionarHistorico(consulta, 'Reagendamento Recusado pelo Cliente', clienteId);
        await consulta.save();

        res.status(200).json({ mensagem: 'Reagendamento recusado. Consulta cancelada.', consulta });

    } catch (error) {
        console.error("Erro ao cliente recusar reagendamento:", error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao recusar reagendamento.' });
    }
};

export const finalizarConsulta = async (req, res) => {
    try {
        const { id } = req.params;
        const profissionalId = req.usuario.id;

        const consulta = await Consulta.findOneAndUpdate(
            { _id: id, profissionalId, statusConsulta: 'confirmada', statusPagamento: 'pago' }, // ✅ Usando profissionalId
            { $set: { statusConsulta: 'finalizada' } },
            { new: true }
        );

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Consulta não encontrada, não confirmada/paga ou já finalizada.' });
        }

        adicionarHistorico(consulta, 'Finalizada', profissionalId);
        await consulta.save();

        res.status(200).json({ mensagem: 'Consulta finalizada com sucesso!', consulta });

    } catch (error) {
        console.error("Erro ao finalizar consulta:", error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao finalizar consulta.' });
    }
};

export const enviarFeedback = async (req, res) => {
    try {
        const { id } = req.params; // id da consulta
        const { nota, comentario } = req.body;
        const clienteId = req.usuario.id;

        if (!nota || nota < 1 || nota > 5) {
            return res.status(400).json({ mensagem: 'Nota deve ser entre 1 e 5.' });
        }

        const consulta = await Consulta.findOneAndUpdate(
            { _id: id, clienteId, statusConsulta: 'finalizada' }, // ✅ Usando clienteId
            {
                $set: {
                    feedBack: {
                        nota,
                        comentario,
                        dataFeedback: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Consulta não encontrada ou não está finalizada.' });
        }

        res.status(200).json({ mensagem: 'Feedback enviado com sucesso!', consulta });
    } catch (error) {
        console.error('Erro ao enviar feedback:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao enviar feedback.' });
    }
};
