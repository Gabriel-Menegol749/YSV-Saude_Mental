import Consulta from '../models/Consulta.js';
import Disponibilidade from '../models/DisponibilidadeHorarios.js';
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

const gerarSlotsPorDia = (inicioDia, fimDia, duracaoConsulta) => {
    const slots = [];
    let currentTime = inicioDia;
    while (isBefore(currentTime, fimDia)) {
        slots.push(format(currentTime, 'HH:mm'));
        currentTime = addMinutes(currentTime, duracaoConsulta);
    }
    return slots;
};

export const solicitarAgendamento = async (req, res) => {
    try {
        console.log('DEBUG Backend - Recebendo solicitação de agendamento:');
        console.log('  req.body:', req.body);
        console.log('  req.usuario.id (clienteId do token):', req.usuario?.id);

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

        // Validação: Cliente não pode agendar consigo mesmo
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

        // ✅ CORREÇÃO DA DATA: Construir a data e hora da consulta de forma robusta
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

        // DEBUG para verificar a data que está sendo usada na query de conflito
        console.log('DEBUG Backend - Verificando conflito para:', {
            profissionalId,
            data: dataConsulta.toISOString(), // Deve ser '2025-12-05T11:40:00.000Z' (ou equivalente no seu fuso)
            horario,
            modalidade
        });

        // ✅ CORREÇÃO: Incluir status 'finalizada' na query de conflito para consistência
        const consultaExistente = await Consulta.findOne({
            profissionalId,
            data: dataConsulta, // Usar a dataConsulta já ajustada
            horario,
            modalidade,
            statusConsulta: { $nin: ['cancelada', 'recusada', 'finalizada'] } // Não considerar canceladas, recusadas ou finalizadas como ocupadas
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
            data: dataConsulta, // Usar a dataConsulta já ajustada
            horario,
            modalidade,
            valor,
            duracao,
            statusPagamento: 'pendente',
            statusConsulta: 'solicitada', // Status inicial
        });

        // ✅ CORREÇÃO AQUI: Passar 'Solicitada' para a função adicionarHistorico
        adicionarHistorico(novaConsulta, 'Solicitada', clienteId);

        await novaConsulta.save();
        console.log('DEBUG Backend - Nova consulta salva com sucesso:', novaConsulta);

        return res.status(201).json({
            mensagem: 'Agendamento solicitado com sucesso!',
            consulta: novaConsulta
        });

    } catch (error) {
        console.error('--- ERRO NO solicitarAgendamento ---');
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        console.error('-----------------------------');
        return res.status(500).json({
            mensagem: 'Erro interno do servidor ao solicitar agendamento.',
            detalhes: error.message,
        });
    }
};

export const getSlotsDisponiveis = async (req, res) => {
    try {
        const { profissionalId } = req.params;
        const { dataInicio, modalidade } = req.query; // vem da Agenda.tsx

        console.log('--- INÍCIO getSlotsDisponiveis ---');
        console.log('Parâmetros recebidos:', { profissionalId, dataInicio, modalidade });

        if (!profissionalId || !dataInicio || !modalidade) {
            console.log('ERRO: Campos obrigatórios faltando para slots.', { profissionalId, dataInicio, modalidade });
            return res.status(400).json({ mensagem: 'ID do profissional, data de início e modalidade são obrigatórios.' });
        }
        if (!['Online', 'Presencial'].includes(modalidade)) {
            console.error('DEBUG Backend - Modalidade inválida para slots:', modalidade);
            return res.status(400).json({ mensagem: 'Modalidade inválida. Deve ser "Online" ou "Presencial".' });
        }

        const configDisponibilidade = await Disponibilidade.findOne({ profissionalId, modalidade });
        console.log('Configuração de disponibilidade encontrada:', configDisponibilidade ? 'Sim' : 'Não');

        if (!configDisponibilidade || !configDisponibilidade.dias || configDisponibilidade.dias.length === 0) {
            console.log('Nenhuma configuração de disponibilidade encontrada para este profissional e modalidade.');
            return res.status(200).json({
                slotsPorDia: {},
                valorConsulta: 0, // ✅ Valor padrão
                duracaoConsulta: 0, // ✅ Valor padrão
                mensagem: 'Nenhuma configuração de disponibilidade encontrada.'
            });
        }

        const profissional = await Usuario.findById(profissionalId).select('infoProfissional.valorConsulta infoProfissional.duracaoConsulta');
        console.log('Dados do profissional para valor/duração:', profissional ? 'Sim' : 'Não');

        let valorConsulta = profissional?.infoProfissional?.valorConsulta || 0; // ✅ Valor padrão
        let duracaoConsulta = profissional?.infoProfissional?.duracaoConsulta || 0; // ✅ Valor padrão

        if (valorConsulta <= 0 || duracaoConsulta <= 0) {
            console.warn(`Valor da consulta (${valorConsulta}) ou duração da sessão (${duracaoConsulta}) inválidos para o profissional ${profissionalId}.`);
            // Se não houver valor/duração válidos, não podemos gerar slots úteis.
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
        const agoraComHora = new Date(); // ✅ Criar uma única instância para o momento atual

        for (let i = 0; i < 7; i++) {
            const dataAtual = addDays(inicioDaSemana, i);
            const dataISO = format(dataAtual, 'yyyy-MM-dd');
            const diaSemanaNome = diasSemanaMap[getDay(dataAtual)];

            console.log(`\nDEBUG Backend - Processando dia: ${dataISO} (${diaSemanaNome})`);

            const hoje = startOfDay(new Date()); // ✅ Usar startOfDay para comparar apenas a data
            if (isBefore(dataAtual, hoje)) {
                console.log(`Dia ${dataISO} é passado, sem slots.`);
                slotsPorDia[dataISO] = [];
                continue; // Pula para o próximo dia
            }

            // 5. Verificar exceções (indisponibilidade total para o dia)
            const excecaoDoDia = configDisponibilidade.excecoes?.find(ex =>
                isSameDay(parseISO(ex.data), dataAtual) && ex.tipo === 'indisponivel'
            );

            if (excecaoDoDia) {
                console.log(`Dia ${dataISO} tem exceção de indisponibilidade.`);
                slotsPorDia[dataISO] = [];
                continue; // Pula para o próximo dia
            }

            // 6. Gerar slots baseados na configuração do dia da semana
            let slotsDoDia = [];
            const configDia = configDisponibilidade.dias.find(d => d.diaSemana === diaSemanaNome);

            if (configDia && configDia.horarios && configDia.horarios.length > 0) {
                configDia.horarios.forEach(bloco => {
                    const [inicioHora, inicioMin] = bloco.horaInicio.split(':').map(Number);
                    const [fimHora, fimMin] = bloco.horaFim.split(':').map(Number);

                    const inicioBloco = setMinutes(setHours(dataAtual, inicioHora), inicioMin);
                    const fimBloco = setMinutes(setHours(dataAtual, fimHora), fimMin);

                    slotsDoDia = slotsDoDia.concat(
                        gerarSlotsPorDia(inicioBloco, fimBloco, duracaoConsulta)
                    );
                });
                slotsDoDia.sort(); // Garante que os slots estejam em ordem
            } else {
                console.log(`Nenhum bloco de horário encontrado para ${diaSemanaNome}.`);
            }

            // 7. Adicionar slots de exceção (disponibilidade extra)
            const excecoesDisponiveis = configDisponibilidade.excecoes?.filter(ex =>
                isSameDay(parseISO(ex.data), dataAtual) && ex.tipo === 'disponivel'
            );

            if (excecoesDisponiveis && excecoesDisponiveis.length > 0) {
                let slotsExtras = [];
                excecoesDisponiveis.forEach(ex => {
                    const [inicioHora, inicioMin] = ex.horaInicio.split(':').map(Number);
                    const [fimHora, fimMin] = ex.horaFim.split(':').map(Number);

                    const inicioBloco = setMinutes(setHours(dataAtual, inicioHora), inicioMin);
                    const fimBloco = setMinutes(setHours(dataAtual, fimHora), fimMin);

                    slotsExtras = slotsExtras.concat(
                        gerarSlotsPorDia(inicioBloco, fimBloco, duracaoConsulta)
                    );
                });
                slotsDoDia = Array.from(new Set([...slotsDoDia, ...slotsExtras])).sort(); // Mescla e remove duplicatas
            }

            // ✅ CORREÇÃO: Filtrar slots que já passaram HOJE e slots ocupados por agendamentos
            let horariosFinaisDoDia = slotsDoDia;

            // 8. Filtrar slots que já passaram no dia atual (considerando a hora)
            if (isSameDay(dataAtual, agoraComHora)) { // Verifica se é o dia de hoje
                horariosFinaisDoDia = horariosFinaisDoDia.filter(hora => {
                    const slotDateTime = parseISO(`${dataISO}T${hora}:00`);
                    return isBefore(agoraComHora, slotDateTime); // Mantém apenas slots futuros
                });
            }

            // 9. Buscar agendamentos existentes para este dia e modalidade
            const agendamentosDoDia = await Consulta.find({
                profissionalId: profissionalId,
                data: {
                    $gte: startOfDay(dataAtual),
                    $lt: addDays(startOfDay(dataAtual), 1)
                },
                modalidade,
                statusConsulta: { $in: ['solicitada', 'confirmada', 'reagendamento_solicitado'] } // Não mostrar slots que estão em processo ou confirmados
            }).select('horario');

            const horariosOcupados = agendamentosDoDia.map(a => a.horario);
            console.log(`Agendamentos ocupados para ${dataISO}:`, horariosOcupados);

            // 10. Remover slots ocupados
            horariosFinaisDoDia = horariosFinaisDoDia.filter(hora => !horariosOcupados.includes(hora));

            slotsPorDia[dataISO] = horariosFinaisDoDia;
            console.log(`Slots finais para ${dataISO}:`, horariosFinaisDoDia);
        }

        console.log('Slots gerados para resposta:', slotsPorDia);
        console.log('--- FIM getSlotsDisponiveis (SUCESSO) ---');
        return res.status(200).json({
            slotsPorDia,
            valorConsulta,
            duracaoConsulta,
            mensagem: "Slots carregados com sucesso."
        });

    } catch (error) {
        console.error('--- ERRO NO getSlotsDisponiveis ---');
        console.error('Erro detalhado:', error);
        console.error('Mensagem de erro:', error.message);
        console.error('Stack trace:', error.stack);
        console.error('--- FIM ERRO ---');
        return res
            .status(500)
            .json({ mensagem: 'Erro no servidor ao buscar disponibilidade.', erro: error.message });
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

        res.status(200).json({ mensagem: 'Agendamento confirmado com sucesso!', consulta });
    } catch (error) {
        console.error('Erro ao confirmar agendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao confirmar agendamento.' });
    }
};

export const cancelarAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id; // Pode ser cliente ou profissional
        const { motivo } = req.body;

        const consulta = await Consulta.findById(id);

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
        }

        const isCliente = String(consulta.clienteId) === String(usuarioId);
        const isProfissional = String(consulta.profissionalId) === String(usuarioId);

        if (!isCliente && !isProfissional) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para cancelar este agendamento.' });
        }

        if (consulta.statusConsulta === 'cancelada') {
            return res.status(400).json({ mensagem: 'Agendamento já foi cancelado.' });
        }

        const agora = new Date();
        const dataConsulta = new Date(consulta.data);
        const [hora, minuto] = consulta.horario.split(':').map(Number);
        dataConsulta.setHours(hora, minuto, 0, 0);

        const diffEmHoras = (dataConsulta.getTime() - agora.getTime()) / (1000 * 60 * 60);

        if (diffEmHoras < 24) {
            return res.status(400).json({ mensagem: 'Não é possível cancelar com menos de 24 horas de antecedência.' });
        }

        const usuarioTipo = isCliente ? 'cliente' : 'profissional';
        const acao = `Cancelamento Solicitado pelo ${usuarioTipo.charAt(0).toUpperCase() + usuarioTipo.slice(1)}`;
        adicionarHistorico(consulta, acao, usuarioId);

        if (motivo) {
            consulta.motivoCancelamento = motivo;
        }

        consulta.statusConsulta = 'cancelada';
        await consulta.save();

        res.status(200).json({ mensagem: 'Agendamento cancelado com sucesso!', consulta });
    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao cancelar agendamento.' });
    }
};
export const solicitarReagendamentoCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const clienteId = req.usuario.id;
        const { novaData, novoHorario } = req.body;

        console.log(`DEBUG Backend - Cliente ${clienteId} solicitando reagendamento para consulta ${id} com nova data: ${novaData}, novo horário: ${novoHorario}`);

        if (!novaData || !novoHorario) {
            return res.status(400).json({ mensagem: 'Nova data e novo horário são obrigatórios para reagendamento.' });
        }

        const consulta = await Consulta.findById(id);

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
        }

        if (String(consulta.clienteId) !== String(clienteId)) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para reagendar esta consulta.' });
        }

        if (consulta.statusConsulta !== 'confirmada' && consulta.statusConsulta !== 'paga') {
            return res.status(400).json({ mensagem: 'Agendamento não está no status correto para reagendamento.' });
        }

        const [horaInt, minutoInt] = novoHorario.split(':').map(Number);
        let novaDataConsulta = parseISO(`${novaData}T00:00:00`);
        novaDataConsulta = setHours(novaDataConsulta, horaInt);
        novaDataConsulta = setMinutes(novaDataConsulta, minutoInt);
        novaDataConsulta = new Date(novaDataConsulta.setSeconds(0, 0));

        const hoje = startOfDay(new Date());
        if (isBefore(startOfDay(novaDataConsulta), hoje)) {
            return res.status(400).json({ mensagem: 'Não é possível reagendar para datas passadas.' });
        }
        const agoraComHora = new Date();
        if (isBefore(novaDataConsulta, agoraComHora)) {
            return res.status(400).json({ mensagem: 'Não é possível reagendar para um horário que já passou.' });
        }

        const profissionalId = consulta.profissionalId;
        const conflitoExistente = await Consulta.findOne({
            profissionalId,
            data: novaDataConsulta,
            horario: novoHorario,
            modalidade: consulta.modalidade,
            statusConsulta: { $nin: ['cancelada', 'recusada', 'finalizada'] },
            _id: { $ne: id }
        });

        if (conflitoExistente) {
            return res.status(409).json({ mensagem: 'O novo horário proposto não está disponível para o profissional.' });
        }

        consulta.data = novaDataConsulta;
        consulta.horario = novoHorario;
        consulta.statusConsulta = 'reagendamento_solicitado';
        adicionarHistorico(consulta, `Reagendamento Solicitado pelo Cliente para ${format(novaDataConsulta, 'dd/MM/yyyy')} às ${novoHorario}`, clienteId);

        await consulta.save();

        res.status(200).json({ mensagem: 'Solicitação de reagendamento enviada com sucesso! O profissional será notificado.', consulta });

    } catch (error) {
        console.error('Erro ao solicitar reagendamento pelo cliente:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao solicitar reagendamento.' });
    }
};
export const solicitarReagendamentoProfissional = async (req, res) => {
    try {
        const { id } = req.params;
        const profissionalId = req.usuario.id;
        const { novaData, novoHorario } = req.body;

        console.log(`DEBUG Backend - Profissional ${profissionalId} solicitando reagendamento para consulta ${id} com nova data: ${novaData}, novo horário: ${novoHorario}`);

        if (!novaData || !novoHorario) {
            return res.status(400).json({ mensagem: 'Nova data e novo horário são obrigatórios para reagendamento.' });
        }

        const consulta = await Consulta.findById(id);

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado.' });
        }

        if (String(consulta.profissionalId) !== String(profissionalId)) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para reagendar esta consulta.' });
        }

        if (consulta.statusConsulta !== 'confirmada' && consulta.statusConsulta !== 'solicitada') {
            return res.status(400).json({ mensagem: 'Agendamento não está no status correto para reagendamento.' });
        }

        const [horaInt, minutoInt] = novoHorario.split(':').map(Number);
        let novaDataConsulta = parseISO(`${novaData}T00:00:00`);
        novaDataConsulta = setHours(novaDataConsulta, horaInt);
        novaDataConsulta = setMinutes(novaDataConsulta, minutoInt);
        novaDataConsulta = new Date(novaDataConsulta.setSeconds(0, 0));

        const hoje = startOfDay(new Date());
        if (isBefore(startOfDay(novaDataConsulta), hoje)) {
            return res.status(400).json({ mensagem: 'Não é possível reagendar para datas passadas.' });
        }
        const agoraComHora = new Date();
        if (isBefore(novaDataConsulta, agoraComHora)) {
            return res.status(400).json({ mensagem: 'Não é possível reagendar para um horário que já passou.' });
        }

        const conflitoExistente = await Consulta.findOne({
            profissionalId,
            data: novaDataConsulta,
            horario: novoHorario,
            modalidade: consulta.modalidade,
            statusConsulta: { $nin: ['cancelada', 'recusada', 'finalizada'] },
            _id: { $ne: id }
        });

        if (conflitoExistente) {
            return res.status(409).json({ mensagem: 'O novo horário proposto já está ocupado por outro agendamento.' });
        }

        consulta.data = novaDataConsulta;
        consulta.horario = novoHorario;
        consulta.statusConsulta = 'reagendamento_solicitado';
        adicionarHistorico(consulta, `Reagendamento Solicitado pelo Profissional para ${format(novaDataConsulta, 'dd/MM/yyyy')} às ${novoHorario}`, profissionalId);

        await consulta.save();

        res.status(200).json({ mensagem: 'Solicitação de reagendamento enviada com sucesso!', consulta });

    } catch (error) {
        console.error('Erro ao solicitar reagendamento pelo profissional:', error);
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

        // Aqui você pode adicionar a lógica para atualizar a data/hora da consulta
        // com os dados do reagendamento proposto, se houver.
        // Por enquanto, apenas confirma o status.
        consulta.statusConsulta = 'confirmada';
        adicionarHistorico(consulta, 'Cliente Aceitou Reagendamento', clienteId);
        await consulta.save();

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

        consulta.statusConsulta = 'recusada'; // Ou voltar para 'solicitada' ou 'cancelada' dependendo da regra de negócio
        adicionarHistorico(consulta, 'Cliente Recusou Reagendamento', clienteId);
        await consulta.save();

        res.status(200).json({ mensagem: 'Reagendamento recusado com sucesso!', consulta });
    } catch (error) {
        console.error('Erro ao recusar reagendamento:', error);
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

        res.status(200).json({ mensagem: 'Feedback enviado com sucesso!', consulta });
    } catch (error) {
        console.error('Erro ao enviar feedback:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao enviar feedback.' });
    }
};

export const getAgendamentosCliente = async (req, res) => {
    try {
        console.log('DEBUG Backend - Iniciando getAgendamentosCliente...');
        const clienteId = req.usuario.id;
        console.log('DEBUG Backend - Cliente ID:', clienteId);

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

        console.log('DEBUG Backend - Query para buscar agendamentos:', query);


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
        console.log('DEBUG Backend - Agendamentos formatados (primeiro item):', agendamentosFormatados[0]);
        console.log('DEBUG Backend - Finalizando getAgendamentosCliente (SUCESSO).');
        return res.status(200).json(agendamentosFormatados);
    } catch (error) {
        console.error('--- ERRO NO getAgendamentosCliente (Backend) ---');
        console.error('Erro detalhado:', error);
        console.error('Mensagem de erro:', error.message);
        console.error('Stack trace:', error.stack);
        console.error('--- FIM ERRO ---');
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
        const profissionalId = req.usuario.id;
        const { modalidade, dias, excecoes } = req.body;

        const profissional = await Usuario.findById(profissionalId);

        if (!profissional || profissional.tipoUsuario !== 'profissional') {
            return res.status(403).json({ mensagem: 'Apenas profissionais podem configurar a disponibilidade.' });
        }

        if (!['Online', 'Presencial'].includes(modalidade)) {
            return res.status(400).json({ mensagem: 'Modalidade inválida. Deve ser "Online" ou "Presencial".' });
        }

        if (!dias || !Array.isArray(dias) || dias.length === 0) {
            return res.status(400).json({ mensagem: 'A configuração de dias é obrigatória.' });
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
            .json({ mensagem: 'Erro no servidor ao configurar disponibilidade.', erro: error.message }); // ✅ Adicionado erro.message
    }
};

export const deleteDisponibilidade = async (req, res) => {
    try {
        const profissionalId = req.usuario.id;
        const { modalidade } = req.params;

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
                .json({ mensagem: 'Configuração de disponibilidade não encontrada.' });
        }

        return res
            .status(200)
            .json({ mensagem: 'Configuração de disponibilidade deletada com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar disponibilidade:', error);
        return res
            .status(500)
            .json({ mensagem: 'Erro no servidor ao deletar disponibilidade.', erro: error.message }); // ✅ Adicionado erro.message
    }
};
