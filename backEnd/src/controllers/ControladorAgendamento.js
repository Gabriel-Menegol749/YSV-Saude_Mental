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

        console.log('--- INÍCIO getSlotsDisponiveis ---');
        console.log('Params recebidos:', { profissionalId, dataInicio, modalidade });

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

        const profissional = await Usuario.findById(profissionalId).select('infoProfissional');
        if (!profissional || !profissional.infoProfissional) {
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
                    return true;
                }).filter(hora => !horariosOcupados.includes(hora));

                slotsPorDia[dataAtualISO] = horariosDisponiveis.sort();
            } else {
                slotsPorDia[dataAtualISO] = [];
            }
        }

        return res.status(200).json({ slotsPorDia, valorConsulta, duracao_Sessao: duracaoSessao });

    } catch (error) {
        console.error("Erro ao buscar slots disponíveis:", error);
        res.status(500).json({ mensagem: 'Erro no servidor ao buscar slots disponíveis.' });
    }
};

export const solicitarAgendamento = async (req, res) => {
    try {
        const { profissionalId, data, horario, modalidade } = req.body;
        const clienteId = req.usuario.id;

        if (!profissionalId || !data || !horario || !modalidade) {
            return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios para solicitar agendamento.' });
        }

        const dataConsulta = parseISO(data);

        const consultaExistente = await Consulta.findOne({
            profissionalId,
            data: {
                $gte: new Date(dataConsulta.getFullYear(), dataConsulta.getMonth(), dataConsulta.getDate(), 0, 0, 0),
                $lt: new Date(dataConsulta.getFullYear(), dataConsulta.getMonth(), dataConsulta.getDate(), 23, 59, 59, 999)
            },
            horario,
            modalidade,
            statusConsulta: { $in: ['solicitada', 'confirmada', 'reagendamento_solicitado'] }
        });

        if (consultaExistente) {
            return res.status(409).json({ mensagem: 'Este horário já está ocupado ou pendente de confirmação.' });
        }

        const profissional = await Usuario.findById(profissionalId).select('infoProfissional');
        if (!profissional || !profissional.infoProfissional) {
            return res.status(404).json({ mensagem: 'Informações do profissional não encontradas.' });
        }

        const novaConsulta = await Consulta.create({
            profissionalId,
            clienteId,
            data: dataConsulta,
            horario,
            modalidade,
            valor: profissional.infoProfissional.valorConsulta,
            duracao: profissional.infoProfissional.duracaoConsulta,
            statusConsulta: 'solicitada'
        });

        res.status(201).json({ mensagem: 'Solicitação de agendamento enviada com sucesso!', consulta: novaConsulta });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensagem: 'Erro no servidor ao solicitar agendamento.' });
    }
};

export const getDisponibilidade = async (req, res) => {
    try {
        const { profissionalId } = req.params;
        const { modalidade } = req.query;
        console.log('getDisponibilidade – params:', { profissionalId, modalidade });
        if (!profissionalId || !modalidade) {
            return res.status(400).json({ mensagem: 'ID do profissional e modalidade são obrigatórios.' });
        }
        const disponibilidade = await Disponibilidade.findOne({ profissionalId, modalidade });
        console.log('getDisponibilidade – resultado do findOne:', disponibilidade);
        if (!disponibilidade) {
            return res.status(404).json({ mensagem: 'Configuração de disponibilidade não encontrada.' });
        }
        res.status(200).json(disponibilidade);
    } catch (error) {
        console.error("Erro ao buscar disponibilidade:", error);
        res.status(500).json({ mensagem: 'Erro no servidor ao buscar disponibilidade.' });
    }
};

export const upsertDisponibilidade = async (req, res) => {
    try {
        const { profissionalId, modalidade, dias, excecoes } = req.body;
        const usuarioLogadoId = req.usuario.id;

        if (!profissionalId || !modalidade || !dias) {
            return res.status(400).json({ mensagem: 'Todos os campos (profissionalId, modalidade, dias) são obrigatórios.' });
        }

        if (profissionalId !== usuarioLogadoId.toString()) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para configurar a disponibilidade de outro profissional.' });
        }

        const profissional = await Usuario.findById(profissionalId);
        if (!profissional || profissional.tipoUsuario !== 'Profissional') {
            return res.status(404).json({ mensagem: 'Profissional não encontrado ou tipo de usuário inválido.' });
        }

        const disponibilidade = await Disponibilidade.findOneAndUpdate(
            { profissionalId, modalidade },
            { dias, excecoes },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({ mensagem: 'Disponibilidade configurada com sucesso!', disponibilidade });

    } catch (error) {
        console.error("Erro ao configurar disponibilidade:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ mensagem: error.message });
        }
        if (error.code === 11000) {
            return res.status(409).json({ mensagem: 'Já existe uma configuração de disponibilidade para este profissional e modalidade.' });
        }
        res.status(500).json({ mensagem: 'Erro no servidor ao configurar disponibilidade.' });
    }
};

export const deleteDisponibilidade = async (req, res) => {
    try {
        const { profissionalId, modalidade } = req.params;
        const usuarioLogadoId = req.usuario.id;

        if (profissionalId !== usuarioLogadoId.toString()) {
            return res.status(403).json({ mensagem: 'Você não tem permissão para deletar esta disponibilidade.' });
        }

        const result = await Disponibilidade.findOneAndDelete({ profissionalId, modalidade });

        if (!result) {
            return res.status(404).json({ mensagem: 'Configuração de disponibilidade não encontrada.' });
        }

        res.status(200).json({ mensagem: 'Configuração de disponibilidade deletada com sucesso.' });

    } catch (error) {
        console.error("Erro ao deletar disponibilidade:", error);
        res.status(500).json({ mensagem: 'Erro no servidor ao deletar disponibilidade.' });
    }
};
