import Usuarios from "../models/Usuarios.js";
import Consulta from '../models/Consulta.js';
import Disponibilidade from '../models/DisponibilidadedeHorarios.js'; // Adicionei o import para o model de disponibilidade

// Duração de 50 minutos por sessão
const duracao_Sessao = 50; 
// Granularidade dos slots exibidos (por exemplo, a cada 30 minutos)
const intervalo_Slot = 30; 
const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/**
 * Função utilitária para verificar se um novo slot conflita com agendamentos existentes.
 * Conflito: O início do novo slot é antes do fim do existente, E o fim do novo slot é depois do início do existente.
 */
const isSlotOccupied = (slotStartTime, duracao, occupiedAppointments) => {
    const slotEndTime = new Date(slotStartTime.getTime() + duracao * 60000);

    for (const consulta of occupiedAppointments) {
        const existenteInicio = new Date(consulta.dataHorario_Consulta);
        // O agendamento existente também tem a duração de duracao_Sessao (50 min)
        const existenteFim = new Date(existenteInicio.getTime() + duracao * 60000);

        if (slotStartTime < existenteFim && slotEndTime > existenteInicio) {
            return true; // CONFLITO!
        }
    }
    return false; // Slot disponível
};

export const calcularSlotsDisponíveis = async (req, res) => {
    const { profissionalId } = req.params;
    const { dataReferencia } = req.query; // Mudança: dataInicio para dataReferencia (qualquer dia da semana)
    
    // Validar a data de referência (pode ser qualquer dia da semana)
    if (!dataReferencia) {
        return res.status(400).json({ mensagem: "A data de referência é obrigatória!" });
    }

    try {
        const profissional = await Usuarios.findById(profissionalId).select('infoProfissional.valorConsulta');
        if (!profissional || profissional.tipoUsuario !== 'Profissional') {
            return res.status(404).json({ mensagem: "Profissional não encontrado!" });
        }
        
        // 1. Obter a Disponibilidade Semanal (usando o model Disponibilidade)
        const disponibilidadeSemanal = await Disponibilidade.findOne({ profissionalId: profissionalId });
        if (!disponibilidadeSemanal) {
             return res.status(404).json({ mensagem: "Disponibilidade do profissional não configurada." });
        }

        const valorConsulta = profissional.infoProfissional.valorConsulta || 0;

        // 2. Definir o período de busca (7 dias a partir da dataReferencia)
        const dataInicial = new Date(dataReferencia);
        dataInicial.setHours(0, 0, 0, 0); // Começa à meia-noite do dia de referência

        const dataFinal = new Date(dataInicial);
        dataFinal.setDate(dataInicial.getDate() + 7); // Termina após 7 dias (exclusivo)

        // 3. Obter Consultas Ocupadas para a semana
        const consultasOcupadas = await Consulta.find({
            ID_Profissional: profissionalId,
            dataHorario_Consulta: { $gte: dataInicial, $lt: dataFinal },
            statusConsulta: { $in: ['solicitada', 'confirmada'] }
        }).select('dataHorario_Consulta');
        
        const slotsDisponiveisPorDia = {};
        
        // 4. Loop pelos 7 dias da semana
        for (let i = 0; i < 7; i++) {
            const dataAtual = new Date(dataInicial);
            dataAtual.setDate(dataInicial.getDate() + i);

            const diaDaSemanaIndex = dataAtual.getDay();
            const diaDaSemana = diasDaSemana[diaDaSemanaIndex];
            
            // Encontrar os horários de trabalho definidos para este dia
            const disponibDia = disponibilidadeSemanal.dias.find(d => d.diaSemana === diaDaSemana);

            if (!disponibDia) continue; // Pula se o profissional não trabalha neste dia

            slotsDisponiveisPorDia[diaDaSemana] = [];

            // 5. Loop pelos blocos de horários definidos (ex: 9:00-12:00, 14:00-18:00)
            for (const bloco of disponibDia.horarios) {
                const [hInicio, mInicio] = bloco.horaInicio.split(':').map(Number);
                const [hFim, mFim] = bloco.horaFim.split(':').map(Number);
                
                let slotAtual = new Date(dataAtual);
                slotAtual.setHours(hInicio, mInicio, 0, 0);

                const slotLimite = new Date(dataAtual);
                slotLimite.setHours(hFim, mFim, 0, 0);

                // 6. Loop de geração de slots a cada `intervalo_Slot` (30 min)
                while (slotAtual < slotLimite) {
                    // O slot precisa terminar antes do limite e ter a duração completa (duracao_Sessao = 50 min)
                    const slotEndTime = new Date(slotAtual.getTime() + duracao_Sessao * 60000);

                    // Verificar se o slot de 50 minutos cabe no bloco de trabalho
                    if (slotEndTime <= slotLimite) {
                        
                        // 7. Verificar conflito com agendamentos existentes (usando a função utilitária)
                        if (!isSlotOccupied(slotAtual, duracao_Sessao, consultasOcupadas)) {
                            // Se estiver disponível, adicione o horário
                            slotsDisponiveisPorDia[diaDaSemana].push({
                                horario: slotAtual.toTimeString().substring(0, 5), // Ex: "09:00"
                                dataHoraISO: slotAtual.toISOString() // Formato completo para agendamento
                            });
                        }
                    }

                    // Avançar para o próximo slot (a cada 30 minutos)
                    slotAtual = new Date(slotAtual.getTime() + intervalo_Slot * 60000);
                }
            }
        }
        
        // 8. Retornar os slots disponíveis e informações da consulta
        res.status(200).json({
            slots: slotsDisponiveisPorDia,
            valorConsulta: valorConsulta,
            duracaoSessao: duracao_Sessao
        });
    } catch (erro) {
        console.error("Erro ao calcular slots: ", erro);
        res.status(500).json({ mensagem: "Erro no servidor ao buscar slots." });
    }
};

export const solicitarAgendamento = async (req, res) => {
    const ID_Cliente = req.usuario.id;
    const { ID_Profissional, dataHorario_Consulta, tipoModalidade } = req.body;

    const dataHora = new Date(dataHorario_Consulta);
    const duracao = duracao_Sessao; // 50 minutos

    // 1. Busca de conflito (com duração)
    const consultasOcupadas = await Consulta.find({
        ID_Profissional,
        statusConsulta: { $in: ['solicitada', 'confirmada'] }
    }).select('dataHorario_Consulta');

    if (isSlotOccupied(dataHora, duracao, consultasOcupadas)) {
        return res.status(409).json({ mensagem: "Este horário não está disponível ou há conflito com outro agendamento." });
    }

    try {
        const profissional = await Usuarios.findById(ID_Profissional).select('infoProfissional.valorConsulta');
        if (!profissional) {
            return res.status(404).json({ mensagem: 'Profissional não encontrado.' });
        }
        const valor_Consulta = profissional.infoProfissional.valorConsulta;

        // 2. Criação da nova consulta
        const novaConsulta = new Consulta({
            ID_Cliente,
            ID_Profissional,
            dataHorario_Consulta: dataHora,
            valor_Consulta,
            statusPagamento: 'pendente',
            statusConsulta: 'solicitada',
            tipoModalidade,
            historicoAcoes: [{ acao: 'Solicitada', porUsuario: ID_Cliente }]
        });

        await novaConsulta.save();

        res.status(201).json({
            mensagem: 'Solicitação de agendamento enviada com sucesso!',
            consulta: novaConsulta
        });
    } catch (erro) {
        console.error("Erro ao solicitar agendamento: ", erro);
        res.status(500).json({ mensagem: "Erro interno no servidor." });
    }
};


export const gerenciarSolicitacao = async (req, res) => {
    const ID_Profissional = req.usuario.id;
    const { consultaId } = req.params;
    const { acao, novaDataHorario } = req.body;

    try {
        const consulta = await Consulta.findOne({ _id: consultaId, ID_Profissional });

        if (!consulta) {
            return res.status(404).json({ mensagem: "Consulta não encontrada" });
        }
        
        let novoStatus;
        let historicoAcao;

        switch (acao) {
            case 'confirmar':
                novoStatus = 'confirmada';
                historicoAcao = 'Confirmada';
                // TODO: Notificação de pagamento
                break;
            case 'recusar':
                novoStatus = 'recusada';
                historicoAcao = 'Recusada';
                // TODO: Notificação de recusa
                break;
            case 'cancelar': // Adicionando caso de cancelamento
                if (consulta.statusConsulta === 'realizada') {
                    return res.status(400).json({ mensagem: "Não é possível cancelar uma consulta realizada." });
                }
                novoStatus = 'cancelada';
                historicoAcao = 'Cancelada';
                // TODO: Notificação de cancelamento
                break;
            case 'reagendar':
                if (consulta.statusConsulta === 'realizada' || consulta.statusConsulta === 'cancelada') {
                    return res.status(400).json({ mensagem: "Não é possível reagendar uma consulta já finalizada ou cancelada." });
                }
                if (!novaDataHorario) {
                    return res.status(400).json({ mensagem: "Nova data e horário são obrigatórios para o reagendamento." });
                }
                
                const novaData = new Date(novaDataHorario);
                const duracao = duracao_Sessao; 
                
                // Validação de conflito para reagendamento
                const consultasOcupadas = await Consulta.find({
                    ID_Profissional,
                    _id: { $ne: consultaId }, // Excluir a consulta atual da verificação de conflito
                    statusConsulta: { $in: ['solicitada', 'confirmada'] }
                }).select('dataHorario_Consulta');

                if (isSlotOccupied(novaData, duracao, consultasOcupadas)) {
                    return res.status(409).json({ mensagem: "O novo horário conflita com outro agendamento existente." });
                }

                novoStatus = 'solicitada'; // O reagendamento volta para o status "solicitada" para o cliente confirmar
                historicoAcao = 'Reagendamento Solicitado';
                consulta.dataHorario_Consulta = novaData;
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
    }
};

export const getSolicitacoes = async (req, res) => {
    const ID_Usuario = req.usuario.id;

    try {
        // Busca agendamentos onde o usuário é o profissional OU o cliente
        const solicitacoes = await Consulta.find({
            $or: [
                { ID_Profissional: ID_Usuario, statusConsulta: { $in: ['solicitada', 'confirmada', 'reagendamento_solicitado'] } },
                { ID_Cliente: ID_Usuario, statusConsulta: { $in: ['solicitada', 'confirmada', 'reagendamento_solicitado'] } }
            ]
        })
        .populate('ID_Cliente', 'nome fotoPerfil')
        .populate('ID_Profissional', 'nome fotoPerfil'); // Também popular o profissional

        res.status(200).json(solicitacoes);
    } catch (erro) {
        console.error("Erro ao buscar solicitações:", erro);
        res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
}