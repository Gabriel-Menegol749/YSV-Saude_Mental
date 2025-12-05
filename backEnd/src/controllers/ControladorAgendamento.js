import Consulta from '../models/Consulta.js';
import Disponibilidade from '../models/DisponibilidadeHorarios.js';
import Notificacao from '../models/Notificacao.js';
import Usuario from '../models/Usuarios.js';
import { format, addDays, addMinutes, isBefore, isSameDay, getDay, parseISO, parse, setHours, setMinutes, startOfDay } from 'date-fns'; // ✅ Adicionado setHours, setMinutes, startOfDay
import { ptBR } from 'date-fns/locale';

const diasSemanaMap = {
    0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado'
};

const adicionarHistorico = (consulta, acao, usuarioId) => {
    consulta.historicoAcoes.push({
        acao: acao,
        porUsuario: usuarioId,
        dataAcao: new Date()
    });
};

export const notificarUsuario = async (ioInstance, usuarioId, tipoNotificacao, dados) => {
  try {
    const notificacaoCriada = await Notificacao.create({
      usuarioId,
      tipo: tipoNotificacao,
      dados,
      timestamp: new Date(),
      lida: false,
    });

    if (ioInstance) {
      const payload = {
        _id: notificacaoCriada._id.toString(),
        tipo: notificacaoCriada.tipo,
        dados: notificacaoCriada.dados,
        timestamp: notificacaoCriada.timestamp.toISOString(),
        lida: notificacaoCriada.lida,
      };

      console.log(
        `DEBUG Backend - Emitindo notificação '${tipoNotificacao}' para o usuário ${usuarioId}`
      );
      ioInstance.to(usuarioId.toString()).emit('notificacao', payload);
    }
  } catch (err) {
    console.error('Erro ao criar/emitir notificação:', err);
  }
};

const gerarSlotsPorDia = (inicioDia, fimDia, duracaoConsulta) => {
    const slots = [];
    let currentTime = inicioDia;
    while (isBefore(currentTime, fimDia)) {
        slots.push(format(currentTime, 'HH:mm'));
        currentTime = addMinutes(currentTime, duracaoConsulta);
    }
    return slots;
};

// ControladorAgendamento.js
export const getSlotsDisponiveis = async (req, res) => {
    try {
        const { profissionalId } = req.params;
        const { dataInicio, modalidade } = req.query;

        if (!profissionalId || !dataInicio || !modalidade) {
            return res.status(400).json({ mensagem: 'ID do profissional, data de início e modalidade são obrigatórios.' });
        }

        if (!['Online', 'Presencial'].includes(modalidade)) {
            console.error('DEBUG Backend - Modalidade inválida para slots:', modalidade);
            return res.status(400).json({ mensagem: 'Modalidade inválida. Deve ser "Online" ou "Presencial".' });
        }

        const configDisponibilidade = await Disponibilidade.findOne({ profissionalId, modalidade });

        if (!configDisponibilidade || !configDisponibilidade.dias || configDisponibilidade.dias.length === 0) {
            console.log('Nenhuma configuração de disponibilidade encontrada para este profissional e modalidade.');
            return res.status(200).json({
                slotsPorDia: {},
                valorConsulta: 0,
                duracaoConsulta: 0,
                mensagem: 'Nenhuma configuração de disponibilidade encontrada.'
            });
        }

        const profissional = await Usuario.findById(profissionalId).select('infoProfissional.valorConsulta infoProfissional.duracaoConsulta');

        let valorConsulta = profissional?.infoProfissional?.valorConsulta || 0;
        let duracaoConsulta = profissional?.infoProfissional?.duracaoConsulta || 0;

        if (valorConsulta <= 0 || duracaoConsulta <= 0) {
            console.warn(`Valor da consulta (${valorConsulta}) ou duração da sessão (${duracaoConsulta}) inválidos para o profissional ${profissionalId}.`);
            return res.status(200).json({
                slotsPorDia: {},
                valorConsulta: valorConsulta,
                duracaoConsulta: duracaoConsulta,
                mensagem: 'Valor ou duração da consulta não configurados para este profissional.'
            });
        }

        console.log(`DEBUG Backend - Valor da consulta: ${valorConsulta} Duração da sessão: ${duracaoConsulta}`);

        const inicioDaSemana = parse(dataInicio, 'dd-MM-yyyy', new Date());
        const slotsPorDia = {};
        const agoraComHora = new Date();

        for (let i = 0; i < 7; i++) {
            const dataAtual = addDays(inicioDaSemana, i);
            const dataISO = format(dataAtual, 'yyyy-MM-dd');
            const diaSemanaNome = diasSemanaMap[getDay(dataAtual)];

            console.log(`\nDEBUG Backend - Processando dia: ${dataISO} (${diaSemanaNome})`);

            const hoje = startOfDay(new Date());
            if (isBefore(dataAtual, hoje)) {
                console.log(`Dia ${dataISO} é passado, sem slots.`);
                slotsPorDia[dataISO] = [];
                continue;
            }

            // Busca exceção para o dia
            const excecaoDoDia = configDisponibilidade.excecoes?.find(ex =>
                isSameDay(parseISO(ex.data), dataAtual) && ex.modalidade === modalidade
            );

            let slotsDoDia = [];

            // Horários padrão para o dia da semana
            const configDia = configDisponibilidade.dias.find(d => d.diaSemana === getDay(dataAtual));
            if (configDia && configDia.horarios && configDia.horarios.length > 0) {
                slotsDoDia = [...configDia.horarios];
                console.log(`DEBUG Backend - Encontrados ${slotsDoDia.length} horários padrão para ${diaSemanaNome}`);
            } else {
                console.log(`Nenhum horário padrão encontrado para ${diaSemanaNome}.`);
            }

            // Se há exceção, usa os horários da exceção
            if (excecaoDoDia) {
                console.log(`DEBUG Backend - Aplicando exceção para ${dataISO}`);
                slotsDoDia = excecaoDoDia.horarios;
                if (slotsDoDia.length === 0) {
                    console.log(`DEBUG Backend - Exceção bloqueia o dia ${dataISO}`);
                }
            }

            // Filtra horários que já passaram (só para hoje)
            if (isSameDay(dataAtual, agoraComHora)) {
                slotsDoDia = slotsDoDia.filter(hora => {
                    const slotDateTime = parseISO(`${dataISO}T${hora}:00`);
                    return isBefore(agoraComHora, slotDateTime);
                });
                console.log(`DEBUG Backend - Após filtro de horário atual, ${slotsDoDia.length} horários restantes para ${dataISO}`);
            }

            // Remove horários já agendados
            const agendamentosDoDia = await Consulta.find({
                profissionalId: profissionalId,
                data: {
                    $gte: startOfDay(dataAtual),
                    $lt: addDays(startOfDay(dataAtual), 1)
                },
                modalidade,
                statusConsulta: { $in: ['solicitada', 'confirmada', 'reagendamento_solicitado'] }
            }).select('horario');

            const horariosOcupados = agendamentosDoDia.map(a => a.horario);
            console.log(`DEBUG Backend - Agendamentos ocupados para ${dataISO}:`, horariosOcupados);

            const horariosFinaisDoDia = slotsDoDia.filter(hora => !horariosOcupados.includes(hora));
            slotsPorDia[dataISO] = horariosFinaisDoDia;

            console.log(`DEBUG Backend - Slots finais para ${dataISO}:`, horariosFinaisDoDia);
        }

        return res.status(200).json({
            slotsPorDia,
            valorConsulta,
            duracaoConsulta,
            mensagem: "Slots carregados com sucesso."
        });

    } catch (e) {
        console.error('DEBUG Backend - Erro ao buscar slots:', e);
        return res
            .status(500)
            .json({ mensagem: 'Erro no servidor ao buscar disponibilidade.', erro: e.message });
    }
};

export const solicitarAgendamento = async (req, res) => {
    try {

        const {
            profissionalId,
            data,
            horario,
            modalidade,
            valor,
            duracao,
        } = req.body;

        const clienteId = req.usuario?.id;
        console.log('DEBUG Backend - Campos extraídos (após ajuste):', {
            profissionalId,
            data,
            horario,
            modalidade,
            valor,
            duracao,
            clienteId
        });

        if (!clienteId) {
            console.error('DEBUG Backend - Erro: clienteId não encontrado no token.');
            return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
        }

        if (clienteId === profissionalId) {
            console.error('DEBUG Backend - Erro: Cliente e Profissional são o mesmo usuário.');
            return res.status(400).json({ mensagem: 'Você não pode agendar uma consulta consigo mesmo.' });
        }

        if (!profissionalId || !data || !horario || !modalidade || valor === undefined || duracao === undefined) {
            console.error('DEBUG Backend - Campos obrigatórios faltando:', {
                profissionalId, data, horario, modalidade, valor, duracao
            });
            return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios para solicitar agendamento.' });
        }

        if (!['Online', 'Presencial'].includes(modalidade)) {
            console.error('DEBUG Backend - Modalidade inválida:', modalidade);
            return res.status(400).json({ mensagem: 'Modalidade de agendamento inválida. Deve ser "Online" ou "Presencial".' });
        }

        if (typeof valor !== 'number' || valor <= 0 || typeof duracao !== 'number' || duracao <= 0) {
            console.error('DEBUG Backend - Valor ou duração inválidos:', { valor, duracao });
            return res.status(400).json({ mensagem: 'Valor e duração da consulta devem ser números positivos.' });
        }

        const dataAgendamentoStr = data; // Ex: '2025-12-05'
        const horarioAgendamentoStr = horario; // Ex: '11:40'

        const [horaInt, minutoInt] = horarioAgendamentoStr.split(':').map(Number);
        let dataConsulta = parseISO(`${dataAgendamentoStr}T00:00:00`); // Inicia o dia na data correta (UTC meia-noite)
        dataConsulta = setHours(dataConsulta, horaInt);
        dataConsulta = setMinutes(dataConsulta, minutoInt);
        dataConsulta = new Date(dataConsulta.setSeconds(0, 0)); // Zera segundos/ms e garante que é um objeto Date

        const hoje = startOfDay(new Date());
        if (isBefore(startOfDay(dataConsulta), hoje)) { // Compara apenas a data
            return res.status(400).json({ mensagem: 'Não é possível agendar para datas passadas.' });
        }

        const agoraComHora = new Date();
        if (isBefore(dataConsulta, agoraComHora)) {
            return res.status(400).json({ mensagem: 'Não é possível agendar para um horário que já passou.' });
        }

        console.log('DEBUG Backend - Verificando conflito para:', {
            profissionalId,
            data: dataConsulta.toISOString(),
            horario,
            modalidade
        });

        const consultaExistente = await Consulta.findOne({
            profissionalId,
            data: dataConsulta,
            horario,
            modalidade,
            statusConsulta: { $nin: ['cancelada', 'recusada', 'finalizada'] }
        });

        if (consultaExistente) {
            console.error('DEBUG Backend - Conflito de agendamento detectado:', consultaExistente);
            return res.status(409).json({ mensagem: 'Este horário já está ocupado ou em processo de agendamento.' });
        }

        const profissional = await Usuario.findById(profissionalId);
        const cliente = await Usuario.findById(clienteId);

        if (!profissional || profissional.tipoUsuario !== 'Profissional') {
            console.error('DEBUG Backend - Profissional não encontrado ou tipo de usuário inválido:', profissionalId);
            return res.status(404).json({ mensagem: 'Profissional não encontrado.' });
        }
        if (!cliente) {
            console.error('DEBUG Backend - Cliente não encontrado:', clienteId);
            return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
        }

        const novaConsulta = new Consulta({
            clienteId,
            profissionalId,
            data: dataConsulta,
            horario,
            modalidade,
            valor,
            duracao,
            statusPagamento: 'pendente',
            statusConsulta: 'solicitada',
        });

        adicionarHistorico(novaConsulta, 'Solicitada', clienteId);

        await novaConsulta.save();

        notificarUsuario(req.io, profissionalId, 'agendamento_solicitado', {
            consultaId: novaConsulta._id,
            data: format(novaConsulta.data, 'dd/MM/yyyy', { locale: ptBR }),
            horario: novaConsulta.horario,
            clienteNome: req.usuario.nome || 'Cliente'
        });


        return res.status(201).json({
            mensagem: 'Agendamento solicitado com sucesso!',
            consulta: novaConsulta
        });

    } catch (error) {
        return res.status(500).json({
            mensagem: 'Erro interno do servidor ao solicitar agendamento.',
            detalhes: error.message,
        });
    }
};

export const confirmarAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const profissionalId = req.usuario.id;

        const consulta = await Consulta.findById(id);

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
        }

        if (String(consulta.profissionalId) !== String(profissionalId)) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para confirmar este agendamento.' });
        }

        if (consulta.statusConsulta !== 'solicitada' && consulta.statusConsulta !== 'reagendamento_solicitado') {
            return res.status(400).json({ mensagem: 'Agendamento não está no status correto para confirmação.' });
        }

        consulta.statusConsulta = 'confirmada';
        adicionarHistorico(consulta, 'Confirmada', profissionalId);
        await consulta.save();

        notificarUsuario(req.io, consulta.clienteId, 'agendamento_confirmado', {
            consultaId: consulta._id,
            data: format(consulta.data, 'dd/MM/yyyy', { locale: ptBR }),
            horario: consulta.horario,
            profissionalNome: req.usuario.nome || 'Profissional'
        });

        res.status(200).json({ mensagem: 'Agendamento confirmado com sucesso!', consulta });
    } catch (error) {
        console.error('Erro ao confirmar agendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao confirmar agendamento.' });
    }
};

export const cancelarAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id;
        const tipoUsuario = req.usuario.tipoUsuario;

        const consulta = await Consulta.findById(id);

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
        }

        if (tipoUsuario === 'cliente' && String(consulta.clienteId) !== String(usuarioId)) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para cancelar este agendamento.' });
        }
        if (tipoUsuario === 'profissional' && String(consulta.profissionalId) !== String(usuarioId)) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para cancelar este agendamento.' });
        }

        if (consulta.statusConsulta === 'finalizada' || consulta.statusConsulta === 'cancelada' || consulta.statusConsulta === 'recusada') {
            return res.status(400).json({ mensagem: `Não é possível cancelar um agendamento com status "${consulta.statusConsulta}".` });
        }

        consulta.statusConsulta = 'cancelada';
        const acaoHistorico = tipoUsuario === 'cliente' ? 'Cancelamento Solicitado pelo Cliente' : 'Cancelamento Solicitado pelo Profissional';
        adicionarHistorico(consulta, acaoHistorico, usuarioId);

        await consulta.save();

        const outroUsuarioId = tipoUsuario === 'cliente' ? consulta.profissionalId : consulta.clienteId;
        const tipoNotificacao = tipoUsuario === 'cliente' ? 'agendamento_cancelado_cliente' : 'agendamento_cancelado_profissional';
        const nomeUsuario = req.usuario.nome || (tipoUsuario === 'cliente' ? 'Cliente' : 'Profissional');

        notificarUsuario(req.io, outroUsuarioId, tipoNotificacao, {
            consultaId: consulta._id,
            nomeUsuario: nomeUsuario,
            data: format(consulta.data, 'dd/MM/yyyy', { locale: ptBR }),
            horario: consulta.horario
        });

        res.status(200).json({ mensagem: 'Agendamento cancelado com sucesso!', consulta });

    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao cancelar agendamento.' });
    }
};

export const solicitarReagendamentoCliente = async (req, res) => {
    try {
        const { id } = req.params; // ID da consulta
        const { novaData, novoHorario } = req.body;
        const clienteId = req.usuario.id;

        if (!novaData || !novoHorario) {
            return res.status(400).json({ mensagem: 'Nova data e novo horário são obrigatórios para o reagendamento.' });
        }

        const consulta = await Consulta.findById(id);

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
        }

        if (String(consulta.clienteId) !== String(clienteId)) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para reagendar este agendamento.' });
        }

        if (!['confirmada', 'reagendamento_solicitado'].includes(consulta.statusConsulta)) {
            return res.status(400).json({ mensagem: 'Agendamento não está no status correto para reagendamento.' });
        }

        const [horaInt, minutoInt] = novoHorario.split(':').map(Number);
        let novaDataConsultaObj = parseISO(`${novaData}T00:00:00`);
        novaDataConsultaObj = setHours(novaDataConsultaObj, horaInt);
        novaDataConsultaObj = setMinutes(novaDataConsultaObj, minutoInt);
        novaDataConsultaObj = new Date(novaDataConsultaObj.setSeconds(0, 0));

        const hoje = startOfDay(new Date());
        if (isBefore(startOfDay(novaDataConsultaObj), hoje)) {
            return res.status(400).json({ mensagem: 'Não é possível reagendar para datas passadas.' });
        }
        const agoraComHora = new Date();
        if (isBefore(novaDataConsultaObj, agoraComHora)) {
            return res.status(400).json({ mensagem: 'Não é possível reagendar para um horário que já passou.' });
        }

        const conflitoExistente = await Consulta.findOne({
            profissionalId: consulta.profissionalId,
            data: novaDataConsultaObj,
            horario: novoHorario,
            modalidade: consulta.modalidade,
            statusConsulta: { $nin: ['cancelada', 'recusada', 'finalizada'] },
            _id: { $ne: id }
        });

        if (conflitoExistente) {
            return res.status(409).json({ mensagem: 'O novo horário proposto já está ocupado por outro agendamento.' });
        }

        consulta.dataPropostaReagendamento = novaDataConsultaObj;
        consulta.horarioPropostoReagendamento = novoHorario;
        consulta.statusConsulta = 'reagendamento_solicitado';

        adicionarHistorico(consulta, `Cliente propôs reagendamento para ${format(novaDataConsultaObj, 'dd/MM/yyyy', { locale: ptBR })} às ${novoHorario}`, clienteId);
        await consulta.save();

        const profissional = await Usuario.findById(consulta.profissionalId);
        notificarUsuario(req.io, consulta.profissionalId, 'reagendamento_proposto_cliente', {
            consultaId: consulta._id,
            novaData: format(novaDataConsultaObj, 'dd/MM/yyyy', { locale: ptBR }),
            novoHorario: novoHorario,
            clienteNome: req.usuario.nome || 'Cliente'
        });

        res.status(200).json({ mensagem: 'Proposta de reagendamento enviada com sucesso!', consulta });

    } catch (error) {
        console.error('Erro ao cliente solicitar reagendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao solicitar reagendamento.' });
    }
};
export const solicitarReagendamentoProfissional = async (req, res) => {
    try {
        const { id } = req.params; // ID da consulta
        const { novaData, novoHorario } = req.body;
        const profissionalId = req.usuario.id;

        if (!novaData || !novoHorario) {
            return res.status(400).json({ mensagem: 'Nova data e novo horário são obrigatórios para o reagendamento.' });
        }

        const consulta = await Consulta.findById(id);

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
        }

        if (String(consulta.profissionalId) !== String(profissionalId)) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para reagendar este agendamento.' });
        }

        if (!['confirmada', 'reagendamento_solicitado'].includes(consulta.statusConsulta)) {
            return res.status(400).json({ mensagem: 'Agendamento não está no status correto para reagendamento.' });
        }

        const [horaInt, minutoInt] = novoHorario.split(':').map(Number);
        let novaDataConsultaObj = parseISO(`${novaData}T00:00:00`);
        novaDataConsultaObj = setHours(novaDataConsultaObj, horaInt);
        novaDataConsultaObj = setMinutes(novaDataConsultaObj, minutoInt);
        novaDataConsultaObj = new Date(novaDataConsultaObj.setSeconds(0, 0));

        const hoje = startOfDay(new Date());
        if (isBefore(startOfDay(novaDataConsultaObj), hoje)) {
            return res.status(400).json({ mensagem: 'Não é possível reagendar para datas passadas.' });
        }
        const agoraComHora = new Date();
        if (isBefore(novaDataConsultaObj, agoraComHora)) {
            return res.status(400).json({ mensagem: 'Não é possível reagendar para um horário que já passou.' });
        }

        const conflitoExistente = await Consulta.findOne({
            profissionalId,
            data: novaDataConsultaObj,
            horario: novoHorario,
            modalidade: consulta.modalidade,
            statusConsulta: { $nin: ['cancelada', 'recusada', 'finalizada'] },
            _id: { $ne: id }
        });

        if (conflitoExistente) {
            return res.status(409).json({ mensagem: 'O novo horário proposto já está ocupado por outro agendamento.' });
        }

        consulta.dataPropostaReagendamento = novaDataConsultaObj;
        consulta.horarioPropostoReagendamento = novoHorario;
        consulta.statusConsulta = 'reagendamento_solicitado';

        adicionarHistorico(consulta, `Profissional propôs reagendamento para ${format(novaDataConsultaObj, 'dd/MM/yyyy', { locale: ptBR })} às ${novoHorario}`, profissionalId);
        await consulta.save();

        const cliente = await Usuario.findById(consulta.clienteId);
        notificarUsuario(req.io, consulta.clienteId, 'reagendamento_proposto_profissional', {
            consultaId: consulta._id,
            novaData: format(novaDataConsultaObj, 'dd/MM/yyyy', { locale: ptBR }),
            novoHorario: novoHorario,
            profissionalNome: req.usuario.nome || 'Profissional'
        });

        res.status(200).json({ mensagem: 'Proposta de reagendamento enviada com sucesso!', consulta });

    } catch (error) {
        console.error('Erro ao profissional solicitar reagendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao solicitar reagendamento.' });
    }
};

export const clienteAceitaReagendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const clienteId = req.usuario.id;

        const consulta = await Consulta.findById(id);

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
        }

        if (String(consulta.clienteId) !== String(clienteId)) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para aceitar este reagendamento.' });
        }

        if (consulta.statusConsulta !== 'reagendamento_solicitado') {
            return res.status(400).json({ mensagem: 'Agendamento não está no status de reagendamento solicitado.' });
        }

        consulta.data = consulta.dataPropostaReagendamento;
        consulta.horario = consulta.horarioPropostoReagendamento;
        consulta.statusConsulta = 'confirmada';
        consulta.dataPropostaReagendamento = undefined; // Limpa a proposta
        consulta.horarioPropostoReagendamento = undefined; // Limpa a proposta

        adicionarHistorico(consulta, `Cliente Aceitou Reagendamento para ${format(consulta.data, 'dd/MM/yyyy', { locale: ptBR })} às ${consulta.horario}`, clienteId);
        await consulta.save();

        notificarUsuario(req.io, consulta.profissionalId, 'reagendamento_aceito_cliente', {
            consultaId: consulta._id,
            data: format(consulta.data, 'dd/MM/yyyy', { locale: ptBR }),
            horario: consulta.horario,
            clienteNome: req.usuario.nome || 'Cliente'
        });

        res.status(200).json({ mensagem: 'Reagendamento aceito com sucesso!', consulta });

    } catch (error) {
        console.error('Erro ao aceitar reagendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao aceitar reagendamento.' });
    }
};

export const clienteRecusaReagendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const clienteId = req.usuario.id;

        const consulta = await Consulta.findById(id);

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
        }

        if (String(consulta.clienteId) !== String(clienteId)) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para recusar este reagendamento.' });
        }

        if (consulta.statusConsulta !== 'reagendamento_solicitado') {
            return res.status(400).json({ mensagem: 'Agendamento não está no status de reagendamento solicitado.' });
        }
        consulta.statusConsulta = 'confirmada';
        consulta.dataPropostaReagendamento = undefined;
        consulta.horarioPropostoReagendamento = undefined;

        adicionarHistorico(consulta, 'Cliente Recusou Reagendamento', clienteId);
        await consulta.save();

        notificarUsuario(req.io, consulta.profissionalId, 'reagendamento_recusado_cliente', {
            consultaId: consulta._id,
            clienteNome: req.usuario.nome || 'Cliente'
        });

        res.status(200).json({ mensagem: 'Reagendamento recusado com sucesso! O agendamento voltou ao status anterior.', consulta });

    } catch (error) {
        console.error('Erro ao recusar reagendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao recusar reagendamento.' });
    }
};

export const profissionalAceitaReagendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const profissionalId = req.usuario.id;

        const consulta = await Consulta.findById(id);

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
        }

        if (String(consulta.profissionalId) !== String(profissionalId)) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para aceitar este reagendamento.' });
        }

        if (consulta.statusConsulta !== 'reagendamento_solicitado' || !consulta.dataPropostaReagendamento || !consulta.horarioPropostoReagendamento) {
            return res.status(400).json({ mensagem: 'Não há proposta de reagendamento pendente para este agendamento.' });
        }

        // Aplica a proposta aceita
        consulta.data = consulta.dataPropostaReagendamento;
        consulta.horario = consulta.horarioPropostoReagendamento;
        consulta.statusConsulta = 'confirmada';
        consulta.dataPropostaReagendamento = undefined;
        consulta.horarioPropostoReagendamento = undefined;

        adicionarHistorico(consulta, `Profissional Aceitou Reagendamento para ${format(consulta.data, 'dd/MM/yyyy', { locale: ptBR })} às ${consulta.horario}`, profissionalId);
        await consulta.save();

        notificarUsuario(req.io, consulta.clienteId, 'reagendamento_aceito_profissional', {
            consultaId: consulta._id,
            data: format(consulta.data, 'dd/MM/yyyy', { locale: ptBR }),
            horario: consulta.horario,
            profissionalNome: req.usuario.nome || 'Profissional'
        });

        res.status(200).json({ mensagem: 'Reagendamento aceito com sucesso!', consulta });

    } catch (error) {
        console.error('Erro ao profissional aceitar reagendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao aceitar reagendamento.' });
    }
};

export const profissionalRecusaReagendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const profissionalId = req.usuario.id;

        const consulta = await Consulta.findById(id);

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
        }

        if (String(consulta.profissionalId) !== String(profissionalId)) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para recusar este reagendamento.' });
        }

        if (consulta.statusConsulta !== 'reagendamento_solicitado' || !consulta.dataPropostaReagendamento || !consulta.horarioPropostoReagendamento) {
            return res.status(400).json({ mensagem: 'Não há proposta de reagendamento pendente para este agendamento.' });
        }

        consulta.statusConsulta = 'confirmada';
        consulta.dataPropostaReagendamento = undefined;
        consulta.horarioPropostoReagendamento = undefined;

        adicionarHistorico(consulta, 'Profissional Recusou Reagendamento', profissionalId);
        await consulta.save();

        notificarUsuario(req.io, consulta.clienteId, 'reagendamento_recusado_profissional', {
            consultaId: consulta._id,
            profissionalNome: req.usuario.nome || 'Profissional'
        });

        res.status(200).json({ mensagem: 'Reagendamento recusado com sucesso! O agendamento voltou ao status anterior.', consulta });

    } catch (error) {
        console.error('Erro ao profissional recusar reagendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao recusar reagendamento.' });
    }
};

export const finalizarConsulta = async (req, res) => {
    try {
        const { id } = req.params;
        const profissionalId = req.usuario.id;

        const consulta = await Consulta.findById(id);

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Consulta não encontrada.' });
        }

        if (String(consulta.profissionalId) !== String(profissionalId)) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para finalizar esta consulta.' });
        }

        if (consulta.statusConsulta !== 'confirmada') {
            return res.status(400).json({ mensagem: 'A consulta não está confirmada para ser finalizada.' });
        }

        consulta.statusConsulta = 'finalizada';
        adicionarHistorico(consulta, 'Consulta Finalizada pelo Profissional', profissionalId);
        await consulta.save();

        notificarUsuario(req.io, consulta.clienteId, 'agendamento_finalizado', {
            consultaId: consulta._id,
            profissionalNome: req.usuario.nome || 'Profissional'
        });

        res.status(200).json({ mensagem: 'Consulta finalizada com sucesso!', consulta });
    } catch (error) {
        console.error('Erro ao finalizar consulta:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao finalizar consulta.' });
    }
};

export const enviarFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { nota, comentario } = req.body;
        const clienteId = req.usuario.id;

        if (!nota || nota < 1 || nota > 5) {
            return res.status(400).json({ mensagem: 'Nota deve ser entre 1 e 5.' });
        }

        const consulta = await Consulta.findOneAndUpdate(
            { _id: id, clienteId, statusConsulta: 'finalizada' },
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

        notificarUsuario(req.io, consulta.profissionalId, 'feedback_adicionado', {
            consultaId: consulta._id,
            clienteNome: req.usuario.nome || 'Cliente',
            nota: nota
        });

        res.status(200).json({ mensagem: 'Feedback enviado com sucesso!', consulta });
    } catch (error) {
        console.error('Erro ao enviar feedback:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao enviar feedback.' });
    }
};

export const getAgendamentosCliente = async (req, res) => {
    try {
        const clienteId = req.usuario.id;

        if (!clienteId) {
            console.error('DEBUG Backend - Erro: clienteId não encontrado no token.');
            return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
        }

        const { status } = req.query;
        let query = { clienteId };

        if (status) {
            if (status === 'cancelada') {
                query.statusConsulta = 'cancelada';
            } else {
                query.statusConsulta = { $in: [status, 'reagendamento_solicitado', 'reagendamento_aceito_cliente', 'reagendamento_recusado_cliente'] };
            }
        } else {
            query.statusConsulta = { $nin: ['cancelada', 'recusada'] };
        }

        const agendamentos = await Consulta.find(query)
            .populate('profissionalId', 'nome email fotoPerfil')
            .sort({ data: -1, horario: 1 })
            .lean();

         const agendamentosFormatados = agendamentos.map(consulta => {
            const profissionalInfo = consulta.profissionalId && typeof consulta.profissionalId === 'object'
                ? {
                    _id: consulta.profissionalId._id,
                    nome: consulta.profissionalId.nome,
                    email: consulta.profissionalId.email,
                    profissao: consulta.profissionalId.infoProfissional?.profissao,
                    crp: consulta.profissionalId.infoProfissional?.crp,
                    fotoPerfil: consulta.profissionalId.fotoPerfil
                }
                : null;
            return {
                ...consulta,
                dataFormatada: format(new Date(consulta.data), 'dd/MM/yyyy', { locale: ptBR }),
                horaFormatada: consulta.horario,
                profissional: profissionalInfo
            };
        });
        return res.status(200).json(agendamentosFormatados);
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor ao buscar agendamentos.', erro: error.message });
    }
};

export const getAgendamentosProfissional = async (req, res) => {
    try {
        const profissionalId = req.usuario.id;
        const { status } = req.query;

        let query = { profissionalId };

        if (status) {
            if (status === 'cancelada') {
                query.statusConsulta = 'cancelada';
            } else {
                query.statusConsulta = status;
            }
        } else {
            query.statusConsulta = { $ne: 'cancelada' };
        }

        const agendamentos = await Consulta.find(query)
            .populate('clienteId', 'nome email fotoPerfil')
            .sort({ data: -1, horario: 1 })
            .lean();

        const agendamentosFormatados = agendamentos.map(consulta => ({
            ...consulta,
            dataFormatada: format(new Date(consulta.data), 'dd/MM/yyyy', { locale: ptBR }),
            horaFormatada: consulta.horario,
            cliente: consulta.clienteId
        }));

        return res.status(200).json(agendamentosFormatados);
    } catch (error) {
        console.error('Erro ao buscar agendamentos do profissional:', error);
        return res.status(500).json({ mensagem: 'Erro interno do servidor ao buscar agendamentos.' });
    }
};

export const upsertDisponibilidade = async (req, res) => {
    try {
        const profissionalId = req.usuario._id || req.usuario.id;
        const { modalidade, dias, excecoes } = req.body;

        const profissional = await Usuario.findById(profissionalId);
        if (
            !profissional ||
            (profissional.tipoUsuario !== 'profissional' &&
            profissional.tipoUsuario !== 'Profissional')
            ) {
            return res.status(403).json({ mensagem: 'Apenas profissionais podem configurar a disponibilidade.' });
        }

        if (!['Online', 'Presencial'].includes(modalidade)) {
            return res.status(400).json({ mensagem: 'Modalidade inválida. Deve ser "Online" ou "Presencial".' });
        }

        // Validação básica para 'dias'
        if (!Array.isArray(dias)) {
            return res.status(400).json({ mensagem: 'O campo "dias" deve ser um array.' });
        }
        // Validação para cada item em 'dias'
        for (const dia of dias) {
            if (typeof dia.diaSemana !== 'number' || !Number.isInteger(dia.diaSemana) || dia.diaSemana < 0 || dia.diaSemana > 6) {
                return res.status(400).json({ mensagem: `Dia da semana inválido: ${dia.diaSemana}. Deve ser um número entre 0 e 6.` });
            }
            if (!Array.isArray(dia.horarios) || !dia.horarios.every(h => typeof h === 'string' && /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(h))) {
                return res.status(400).json({ mensagem: `Horários inválidos para o dia ${dia.diaSemana}. Devem ser um array de strings HH:MM.` });
            }
        }

        // Validação básica para 'excecoes'
        if (!Array.isArray(excecoes)) {
            return res.status(400).json({ mensagem: 'O campo "excecoes" deve ser um array.' });
        }
        // Validação para cada item em 'excecoes'
        for (const excecao of excecoes) {
            if (!excecao.data || isNaN(new Date(excecao.data).getTime())) {
                return res.status(400).json({ mensagem: `Data de exceção inválida: ${excecao.data}.` });
            }
            if (!Array.isArray(excecao.horarios) || !excecao.horarios.every(h => typeof h === 'string' && /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(h))) {
                return res.status(400).json({ mensagem: `Horários inválidos para a exceção em ${excecao.data}. Devem ser um array de strings HH:MM.` });
            }
            if (!['Online', 'Presencial'].includes(excecao.modalidade)) {
                return res.status(400).json({ mensagem: `Modalidade inválida para a exceção em ${excecao.data}. Deve ser "Online" ou "Presencial".` });
            }
        }

        const disponibilidadeAtualizada = await Disponibilidade.findOneAndUpdate(
            { profissionalId, modalidade },
            { dias, excecoes },
            { new: true, upsert: true, runValidators: true }
        );

        return res.status(200).json({
            mensagem: 'Disponibilidade configurada/atualizada com sucesso.',
            disponibilidade: disponibilidadeAtualizada,
        });
    } catch (error) {
        console.error('Erro ao configurar disponibilidade:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ mensagem: error.message });
        }
        if (error.code === 11000) {
            return res.status(409).json({
                mensagem: 'Já existe uma configuração de disponibilidade para este profissional e modalidade.',
            });
        }
        return res
            .status(500)
            .json({ mensagem: 'Erro no servidor ao configurar disponibilidade.', erro: error.message });
    }
};

export const deleteDisponibilidade = async (req, res) => {
    try {
        const profissionalId = req.usuario.id;
        const { modalidade } = req.params; // Pega a modalidade dos parâmetros da URL

        const profissional = await Usuario.findById(profissionalId);
        if (!profissional || profissional.tipoUsuario !== 'profissional') {
            return res.status(403).json({ mensagem: 'Apenas profissionais podem deletar a disponibilidade.' });
        }

        if (!['Online', 'Presencial'].includes(modalidade)) {
            return res.status(400).json({ mensagem: 'Modalidade inválida. Deve ser "Online" ou "Presencial".' });
        }

        const result = await Disponibilidade.findOneAndDelete({
            profissionalId,
            modalidade,
        });

        if (!result) {
            return res
                .status(404)
                .json({ mensagem: 'Configuração de disponibilidade não encontrada para esta modalidade.' });
        }

        return res
            .status(200)
            .json({ mensagem: `Configuração de disponibilidade ${modalidade} deletada com sucesso.` });
    } catch (error) {
        console.error('Erro ao deletar disponibilidade:', error);
        return res
            .status(500)
            .json({ mensagem: 'Erro no servidor ao deletar disponibilidade.', erro: error.message });
    }
};

export const processarPagamentoSimples = async (req, res) => {
    try {
        const { id } = req.params;
        const clienteId = req.usuario.id;
        console.log(`DEBUG Backend - Cliente ${clienteId} tentando pagar consulta ${id}`);

        const consulta = await Consulta.findById(id);

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
        }

        if (String(consulta.clienteId) !== String(clienteId)) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para pagar este agendamento.' });
        }

        if (consulta.statusConsulta !== 'confirmada') {
            return res.status(400).json({ mensagem: 'A consulta não está confirmada para ser paga.' });
        }

        if (consulta.statusPagamento === 'pago') {
            return res.status(400).json({ mensagem: 'Este agendamento já foi pago.' });
        }

        consulta.statusPagamento = 'pago';

        adicionarHistorico(consulta, 'Pagamento Realizado (Simulado)', clienteId);

        await consulta.save();

         notificarUsuario(req.io, consulta.profissionalId, 'pagamento_realizado', {
            consultaId: consulta._id,
            clienteNome: req.usuario.nome || 'Cliente'
        });

        res.status(200).json({ mensagem: 'Pagamento processado com sucesso (simulado)!', consulta });

    } catch (error) {
        console.error('Erro ao processar pagamento simples:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao processar pagamento.' });
    }
};
