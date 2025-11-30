import Consulta from '../models/Consulta.js';
import Disponibilidade from '../models/DisponibilidadeHorarios.js';
import Usuario from '../models/Usuarios.js';
import { format, addDays, addMinutes, isBefore, isSameDay, getDay, parseISO, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
                    profissionalId: profissionalId,
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
                    return true; // Para dias futuros, todos os horários base são considerados
                }).filter(hora => !horariosOcupados.includes(hora)); // Remove horários já ocupados

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
// ...
export const solicitarAgendamento = async (req, res) => {
    try {
        const { profissionalId, data, horario, modalidade } = req.body;
        const clienteId = req.usuario.id; // ID do cliente logado

        if (!profissionalId || !data || !horario || !modalidade) {
            return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios para solicitar agendamento.' });
        }

        // Buscar o profissional para obter valorConsulta e duracaoConsulta
        const profissional = await Usuario.findById(profissionalId);
        if (!profissional || profissional.tipoUsuario !== 'Profissional') {
            return res.status(404).json({ mensagem: 'Profissional não encontrado.' });
        }

        // ✅ CORREÇÃO: Obter valorConsulta e duracaoConsulta do profissional
        const valorConsulta = profissional.infoProfissional?.valorConsulta;
        const duracaoConsulta = profissional.infoProfissional?.duracaoConsulta;

        if (valorConsulta === undefined || duracaoConsulta === undefined) {
            return res.status(400).json({ mensagem: 'Dados de consulta (valor ou duração) do profissional estão incompletos.' });
        }

        // Verificar se o slot já está ocupado
        const slotOcupado = await Consulta.findOne({
            profissional: profissionalId,
            data: parseISO(data), // Garante que a data seja um objeto Date
            horario,
            status: { $in: ['pendente', 'confirmada', 'paga'] }
        });

        if (slotOcupado) {
            return res.status(409).json({ mensagem: 'Este horário já está ocupado.' });
        }

        const novaConsulta = new Consulta({
            cliente: clienteId,
            profissional: profissionalId,
            data: parseISO(data), // Garante que a data seja um objeto Date
            horario,
            modalidade,
            valor: valorConsulta, // ✅ Usando o valor do profissional
            duracao: duracaoConsulta, // ✅ Usando a duração do profissional
            status: 'pendente',
        });

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
        if (tipoUsuario === 'Cliente') {
            consultas = await Consulta.find({ cliente: usuarioId })
                .populate('profissional', 'nome fotoPerfil infoProfissional.profissao') // Popula dados do profissional
                .populate('cliente', 'nome fotoPerfil') // Popula dados do cliente (para consistência, embora seja o próprio)
                .sort({ data: 1 });
        } else if (tipoUsuario === 'Profissional') {
            consultas = await Consulta.find({ profissional: usuarioId })
                .populate('cliente', 'nome fotoPerfil') // Popula dados do cliente
                .populate('profissional', 'nome fotoPerfil infoProfissional.profissao') // Popula dados do profissional (para consistência)
                .sort({ data: 1 });
        } else {
            return res.status(403).json({ mensagem: 'Tipo de usuário não autorizado para listar consultas.' });
        }

        // Formatar a data e hora para exibição
        const consultasFormatadas = consultas.map(consulta => {
            const dataFormatada = format(consulta.data, 'dd/MM/yyyy', { locale: ptBR });
            const horaFormatada = format(consulta.data, 'HH:mm', { locale: ptBR });
            const profissionalNome = consulta.profissional ? consulta.profissional.nome : 'Profissional Desconhecido';
            const profissionalFoto = consulta.profissional ? consulta.profissional.fotoPerfil : undefined;
            const profissionalProfissao = consulta.profissional?.infoProfissional?.profissao; // ✅ Acessa a profissão corretamente
            const clienteNome = consulta.cliente ? consulta.cliente.nome : 'Cliente Desconhecido';
            const clienteFoto = consulta.cliente ? consulta.cliente.fotoPerfil : undefined;

            return {
                ...consulta.toObject(),
                dataHoraFormatada: `${dataFormatada} às ${horaFormatada}`,
                profissionalNome,
                profissionalFoto,
                profissionalProfissao, // ✅ Inclui a profissão
                clienteNome,
                clienteFoto,
            };
        });

        res.status(200).json(consultasFormatadas);
    } catch (error) {
        console.error('Erro ao listar consultas do usuário:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao listar consultas.' });
    }
};

export const aceitarAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const profissionalId = req.usuario.id;

        const consulta = await Consulta.findOneAndUpdate(
            { _id: id, profissional: profissionalId, status: 'pendente' },
            { $set: { status: 'confirmada' } },
            { new: true }
        );

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado ou não pode ser aceito.' });
        }

        res.status(200).json({ mensagem: 'Agendamento aceito com sucesso!', consulta });
    } catch (error) {
        console.error('Erro ao aceitar agendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao aceitar agendamento.' });
    }
};

export const reagendarAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const { novaData, novoHorario } = req.body;
        const profissionalId = req.usuario.id;

        if (!novaData || !novoHorario) {
            return res.status(400).json({ mensagem: 'Nova data e novo horário são obrigatórios para reagendamento.' });
        }

        const dataHoraReagendamento = parse(`${novaData} ${novoHorario}`, 'yyyy-MM-dd HH:mm', new Date());

        if (isNaN(dataHoraReagendamento.getTime())) {
            return res.status(400).json({ mensagem: 'Formato de nova data ou novo horário inválido.' });
        }

        // Verificar se o novo slot já está ocupado
        const slotOcupado = await Consulta.findOne({
            profissional: profissionalId,
            data: dataHoraReagendamento,
            status: { $in: ['pendente', 'confirmada', 'paga', 'reagendamento_solicitado'] },
            _id: { $ne: id } // Excluir a própria consulta que está sendo reagendada
        });

        if (slotOcupado) {
            return res.status(409).json({ mensagem: 'O novo horário sugerido já está ocupado.' });
        }

        const consulta = await Consulta.findOneAndUpdate(
            { _id: id, profissional: profissionalId, status: { $in: ['pendente', 'confirmada', 'paga'] } },
            {
                $set: {
                    data: dataHoraReagendamento,
                    status: 'reagendamento_solicitado',
                    dataReagendamento: dataHoraReagendamento // Armazena a data sugerida para o cliente aceitar/recusar
                }
            },
            { new: true }
        );

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado ou não pode ser reagendado.' });
        }

        res.status(200).json({ mensagem: 'Solicitação de reagendamento enviada com sucesso!', consulta });
    } catch (error) {
        console.error('Erro ao reagendar agendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao reagendar agendamento.' });
    }
};

export const recusarAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const profissionalId = req.usuario.id;

        const consulta = await Consulta.findOneAndUpdate(
            { _id: id, profissional: profissionalId, status: 'pendente' },
            { $set: { status: 'recusada' } },
            { new: true }
        );

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado ou não pode ser recusado.' });
        }

        res.status(200).json({ mensagem: 'Agendamento recusado com sucesso!', consulta });
    } catch (error) {
        console.error('Erro ao recusar agendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao recusar agendamento.' });
    }
};

export const cancelarAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const clienteId = req.usuario.id;

        const consulta = await Consulta.findOneAndUpdate(
            { _id: id, cliente: clienteId, status: { $in: ['pendente', 'confirmada', 'paga', 'reagendamento_solicitado'] } },
            { $set: { status: 'cancelada' } },
            { new: true }
        );

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado ou não pode ser cancelado.' });
        }

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
            { _id: id, cliente: clienteId, status: 'confirmada' },
            { $set: { status: 'paga' } },
            { new: true }
        );

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Agendamento não encontrado ou não pode ser pago.' });
        }

        res.status(200).json({ mensagem: 'Consulta paga com sucesso!', consulta });
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
            { _id: id, cliente: clienteId, status: 'reagendamento_solicitado' },
            { $set: { status: 'confirmada' } }, // Volta para confirmada com a nova data
            { new: true }
        );

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Solicitação de reagendamento não encontrada ou não pode ser aceita.' });
        }

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

        const consulta = await Consulta.findOneAndUpdate(
            { _id: id, cliente: clienteId, status: 'reagendamento_solicitado' },
            { $set: { status: 'cancelada' } }, // Cliente recusou, cancela a consulta
            { new: true }
        );

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Solicitação de reagendamento não encontrada ou não pode ser recusada.' });
        }

        res.status(200).json({ mensagem: 'Reagendamento recusado. Consulta cancelada.', consulta });
    } catch (error) {
        console.error('Erro ao recusar reagendamento:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao recusar reagendamento.' });
    }
};