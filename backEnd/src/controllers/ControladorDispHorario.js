import Disponibilidade from '../models/DisponibilidadeHorarios.js'; // Importar o modelo de Disponibilidade
import Usuario from '../models/Usuarios.js'; // Importar o modelo de Usuário para pegar valor/duração
import Consulta from '../models/Consulta.js'; // ✅ Importar o modelo de Consulta para verificar agendamentos existentes

import {
    startOfWeek,
    addDays,
    format,
    parse,
    isWithinInterval,
    setHours,
    setMinutes,
    isBefore,
    startOfDay,
    isSameDay,
    getDay,
    parseISO // ✅ Importar parseISO para lidar com datas e horas
} from 'date-fns';
import { ptBR } from 'date-fns/locale'; // Embora não usado diretamente aqui, é bom manter se for para formatação de saída

// Função auxiliar para adicionar minutos a uma data
const addMinutes = (date, minutes) => {
    return new Date(date.getTime() + minutes * 60000);
};

// Função auxiliar para gerar slots de horário
const gerarSlotsPorDia = (inicioDia, fimDia, duracaoConsulta) => {
    const slots = [];
    let currentTime = inicioDia;
    while (isBefore(currentTime, fimDia)) {
        slots.push(format(currentTime, 'HH:mm'));
        currentTime = addMinutes(currentTime, duracaoConsulta);
    }
    return slots;
};

export const getSlotsDisponiveis = async (req, res) => { // ✅ Renomeado para getSlotsDisponiveis para clareza e consistência com o frontend
    try {
        const { profissionalId } = req.params;
        const { dataInicio, modalidade } = req.query; // vem da Agenda.tsx

        console.log('--- INÍCIO getSlotsDisponiveis ---');
        console.log('Parâmetros recebidos:', { profissionalId, dataInicio, modalidade });

        if (!profissionalId || !dataInicio || !modalidade) {
            console.log('ERRO: Campos obrigatórios faltando para slots.', { profissionalId, dataInicio, modalidade });
            return res.status(400).json({ mensagem: 'ID do profissional, data de início e modalidade são obrigatórios.' });
        }

        // ✅ CORREÇÃO: Remover a opção Híbrido e validar modalidades
        if (modalidade === 'Híbrido') {
            console.log('ERRO: Modalidade Híbrido não é mais suportada.');
            return res.status(400).json({ mensagem: 'A modalidade Híbrido não é mais suportada.' });
        }
        if (!['Online', 'Presencial'].includes(modalidade)) {
            console.log('ERRO: Modalidade inválida ou não fornecida:', modalidade);
            return res.status(400).json({ mensagem: 'Modalidade inválida ou não fornecida. Use Online ou Presencial.' });
        }

        // 1. Buscar profissional para pegar valor/duração
        const profissional = await Usuario.findById(profissionalId).select(
            'infoProfissional.valorConsulta infoProfissional.duracaoConsulta'
        );
        console.log('Profissional encontrado:', profissional);

        if (!profissional || !profissional.infoProfissional) {
            console.log('ERRO: Profissional não encontrado ou sem infoProfissional.');
            return res
                .status(404)
                .json({ mensagem: 'Profissional não encontrado ou sem informações de consulta.' });
        }

        const valorConsulta = profissional.infoProfissional.valorConsulta || 0;
        const duracaoConsulta = profissional.infoProfissional.duracaoConsulta || 50;
        console.log('Valor e Duração da Consulta:', { valorConsulta, duracaoConsulta });

        if (duracaoConsulta <= 0) {
            console.error("DEBUG Backend - Erro 400: Duração da sessão inválida:", duracaoConsulta);
            return res.status(400).json({ mensagem: 'Duração da sessão deve ser maior que zero.' });
        }

        // 2. Buscar configuração de disponibilidade dessa modalidade
        const configDisponibilidade = await Disponibilidade.findOne({
            profissionalId,
            modalidade,
        });
        console.log('Configuração de Disponibilidade encontrada:', configDisponibilidade);

        if (!configDisponibilidade) {
            console.log('Nenhuma configuração de disponibilidade encontrada para esta modalidade.');
            return res.status(200).json({
                slotsPorDia: {},
                valorConsulta,
                duracaoConsulta,
                mensagem:
                    'Nenhuma configuração de disponibilidade encontrada para esta modalidade. Por favor, configure os horários.',
            });
        }

        // 3. Período da semana
        const inicioDaSemana = dataInicio
            ? startOfWeek(parse(dataInicio, 'dd-MM-yyyy', new Date()), {
                weekStartsOn: 0,
            })
            : startOfWeek(new Date(), { weekStartsOn: 0 });
        console.log('Início da Semana:', format(inicioDaSemana, 'dd-MM-yyyy'));

        const slotsPorDia = {};
        const hoje = startOfDay(new Date()); // Início do dia atual (00:00:00)
        const agoraComHora = new Date(); // Data e hora atual para comparar slots

        // 4. Gerar slots para 7 dias
        const diasDaSemanaMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']; // Para mapear getDay()

        for (let i = 0; i < 7; i++) {
            const dataAtual = addDays(inicioDaSemana, i);
            const dataISO = format(dataAtual, 'yyyy-MM-dd');
            const nomeDiaSemanaBanco = diasDaSemanaMap[getDay(dataAtual)]; // Usa o índice do dia da semana
            console.log(`Processando dia: ${dataISO} (${nomeDiaSemanaBanco})`);

            // ✅ CORREÇÃO: Ignora dias completamente passados (apenas a data)
            if (isBefore(dataAtual, hoje) && !isSameDay(dataAtual, hoje)) {
                console.log(`Dia ${dataISO} é passado, ignorando.`);
                slotsPorDia[dataISO] = [];
                continue;
            }

            // Encontra config para este dia
            const diaConfig = configDisponibilidade.dias.find(
                (d) => d.diaSemana === nomeDiaSemanaBanco
            );
            console.log(`Configuração para ${nomeDiaSemanaBanco}:`, diaConfig);

            let slotsDoDia = [];
            if (diaConfig && diaConfig.horarios && diaConfig.horarios.length > 0) {
                diaConfig.horarios.forEach((bloco) => {
                    console.log('Processando bloco de horário:', bloco);
                    const [inicioHora, inicioMin] = bloco.horaInicio.split(':').map(Number);
                    const [fimHora, fimMin] = bloco.horaFim.split(':').map(Number);

                    const inicioBloco = setMinutes(
                        setHours(dataAtual, inicioHora),
                        inicioMin
                    );
                    const fimBloco = setMinutes(setHours(dataAtual, fimHora), fimMin);

                    slotsDoDia = slotsDoDia.concat(
                        gerarSlotsPorDia(inicioBloco, fimBloco, duracaoConsulta)
                    );
                });
            } else {
                console.log(`Nenhum bloco de horário encontrado para ${nomeDiaSemanaBanco}.`);
            }

            // 5. Aplicar exceções (indisponível/disponível)
            const excecaoDoDia = configDisponibilidade.excecoes.find((e) =>
                isSameDay(new Date(e.data), dataAtual)
            );
            console.log(`Exceção para ${dataISO}:`, excecaoDoDia);

            if (excecaoDoDia) {
                if (excecaoDoDia.bloquearDiaInteiro) {
                    console.log(`Exceção: Bloqueando dia inteiro ${dataISO}.`);
                    slotsDoDia = [];
                } else if (
                    excecaoDoDia.tipo === 'indisponivel' &&
                    excecaoDoDia.horarios &&
                    excecaoDoDia.horarios.length > 0
                ) {
                    console.log(`Exceção: Removendo slots indisponíveis para ${dataISO}.`);
                    slotsDoDia = slotsDoDia.filter((slot) => {
                        const slotTime = parse(slot, 'HH:mm', dataAtual);
                        return !excecaoDoDia.horarios.some((exHorario) => {
                            const inicioEx = parse(exHorario.horaInicio, 'HH:mm', dataAtual);
                            const fimEx = parse(exHorario.horaFim, 'HH:mm', dataAtual);
                            // Verifica se o slot está dentro do intervalo de indisponibilidade
                            return isWithinInterval(slotTime, { start: inicioEx, end: fimEx });
                        });
                    });
                } else if (
                    excecaoDoDia.tipo === 'disponivel' &&
                    excecaoDoDia.horarios &&
                    excecaoDoDia.horarios.length > 0
                ) {
                    console.log(`Exceção: Adicionando slots extras para ${dataISO}.`);
                    let slotsExtras = [];
                    excecaoDoDia.horarios.forEach((bloco) => {
                        const [inicioHora, inicioMin] = bloco.horaInicio.split(':').map(Number);
                        const [fimHora, fimMin] = bloco.horaFim.split(':').map(Number);

                        const inicioBloco = setMinutes(
                            setHours(dataAtual, inicioHora),
                            inicioMin
                        );
                        const fimBloco = setMinutes(setHours(dataAtual, fimHora), fimMin);

                        slotsExtras = slotsExtras.concat(
                            gerarSlotsPorDia(inicioBloco, fimBloco, duracaoConsulta)
                        );
                    });
                    slotsDoDia = Array.from(new Set([...slotsDoDia, ...slotsExtras])).sort();
                }
            }

            // ✅ CORREÇÃO: Filtrar slots que já passaram HOJE e slots ocupados por agendamentos
            let horariosFinaisDoDia = slotsDoDia;

            // 6. Filtrar slots que já passaram no dia atual (considerando a hora)
            if (isSameDay(dataAtual, agoraComHora)) {
                horariosFinaisDoDia = horariosFinaisDoDia.filter(hora => {
                    const slotDateTime = parseISO(`${dataISO}T${hora}:00`);
                    return isBefore(agoraComHora, slotDateTime); // Mantém apenas slots futuros
                });
            }

            // 7. Buscar agendamentos existentes para este dia e modalidade
            const agendamentosDoDia = await Consulta.find({
                profissionalId: profissionalId, // ✅ Usar 'profissionalId' conforme o schema de Consulta e o parâmetro da rota
                data: { // Busca por data exata, mas o MongoDB compara Date objetos.
                    $gte: startOfDay(dataAtual),
                    $lt: addDays(startOfDay(dataAtual), 1)
                },
                modalidade,
                statusConsulta: { $in: ['solicitada', 'confirmada', 'reagendamento_solicitado'] }
            }).select('horario');
            const horariosOcupados = agendamentosDoDia.map(a => a.horario);
            console.log(`Agendamentos ocupados para ${dataISO}:`, horariosOcupados);

            // 8. Remover slots ocupados
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

export const upsertDisponibilidade = async (req, res) => {
    try {
        const profissionalId = req.usuario.id;
        const { modalidade, dias, excecoes } = req.body;

        if (!modalidade || !dias) {
            return res
                .status(400)
                .json({ mensagem: 'Todos os campos (modalidade e dias) são obrigatórios.' });
        }

        const profissional = await Usuario.findById(profissionalId);
        if (!profissional || profissional.tipoUsuario !== 'Profissional') {
            return res
                .status(403)
                .json({ mensagem: 'Apenas profissionais podem configurar a disponibilidade.' });
        }

        // ✅ CORREÇÃO: Remover a opção Híbrido
        if (modalidade === 'Híbrido') {
            return res
                .status(400)
                .json({ mensagem: 'A modalidade Híbrido não é mais suportada.' });
        }
        if (!['Online', 'Presencial'].includes(modalidade)) { // ✅ Validação de modalidade
            return res.status(400).json({ mensagem: 'Modalidade inválida. Use Online ou Presencial.' });
        }

        const disponibilidade = await Disponibilidade.findOneAndUpdate(
            { profissionalId, modalidade },
            { dias, excecoes },
            { new: true, upsert: true, runValidators: true }
        );

        return res.status(200).json({
            mensagem: 'Disponibilidade configurada/atualizada com sucesso.',
            disponibilidade,
        });
    } catch (error) {
        console.error('Erro ao configurar disponibilidade:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ mensagem: error.message });
        }
        if (error.code === 11000) {
            return res.status(409).json({
                mensagem:
                    'Já existe uma configuração de disponibilidade para este profissional e modalidade.',
            });
        }
        return res
            .status(500)
            .json({ mensagem: 'Erro no servidor ao configurar disponibilidade.' });
    }
};

export const deleteDisponibilidade = async (req, res) => {
    try {
        const profissionalId = req.usuario.id;
        const { modalidade } = req.params;

        const profissional = await Usuario.findById(profissionalId);
        if (!profissional || profissional.tipoUsuario !== 'Profissional') {
            return res
                .status(403)
                .json({ mensagem: 'Apenas profissionais podem deletar a disponibilidade.' });
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
            .json({ mensagem: 'Erro no servidor ao deletar disponibilidade.' });
    }
};
