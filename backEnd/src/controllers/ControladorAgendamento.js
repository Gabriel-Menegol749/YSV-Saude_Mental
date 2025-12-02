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

    console.log('DEBUG Backend - Recebendo requisição de slots:', { profissionalId, dataInicio, modalidade });

    if (!profissionalId || !dataInicio || !modalidade) {
      console.error('DEBUG Backend - Erro 400: Campos obrigatórios faltando para slots.', { profissionalId, dataInicio, modalidade });
      return res.status(400).json({ mensagem: 'ID do profissional, data de início e modalidade são obrigatórios.' });
    }

    const inicioSemana = parse(dataInicio, 'dd-MM-yyyy', new Date());
    if (isNaN(inicioSemana.getTime())) {
      console.error("DEBUG Backend - Erro 400: dataInicio inválida após parse:", dataInicio);
      return res.status(400).json({ mensagem: 'Formato de data de início inválido. Use dd-MM-yyyy.' });
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const configDisponibilidade = await Disponibilidade.findOne({ profissionalId, modalidade });
    if (!configDisponibilidade) {
      console.warn('DEBUG Backend - Aviso: Configuração de disponibilidade não encontrada para esta modalidade. Retornando slots vazios.');
      return res.status(200).json({
        slotsPorDia: {},
        valorConsulta,
        duracaoConsulta: duracaoSessao,
        mensagem: "Nenhuma configuração de disponibilidade encontrada para esta modalidade. Por favor, configure os horários."
      });
    }
    console.log('DEBUG Backend - Configuração de disponibilidade encontrada.');

    const profissional = await Usuario.findById(profissionalId).select('infoProfissional');
    if (!profissional || !profissional.infoProfissional) {
      console.error('DEBUG Backend - Erro 404: Informações do profissional (valor/duração) não encontradas.');
      return res.status(404).json({ mensagem: 'Informações do profissional (valor/duração) não encontradas.' });
    }

    const valorConsulta = profissional.infoProfissional.valorConsulta || 0;
    const duracaoSessao = profissional.infoProfissional.duracaoConsulta || 50;
    console.log('DEBUG Backend - Valor da consulta:', valorConsulta, 'Duração da sessão:', duracaoSessao);

    if (duracaoSessao <= 0) {
      console.error("DEBUG Backend - Erro 400: Duração da sessão inválida:", duracaoSessao);
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
        console.log(`DEBUG Backend - Dia ${dataAtualISO} é passado, sem slots.`);
        continue;
      }

      const configDia = configDisponibilidade.dias.find(d => d.diaSemana === nomeDiaSemanaBanco);

      let horariosBaseDoDia = [];
      if (configDia && configDia.horarios.length > 0) {
        configDia.horarios.forEach(bloco => {
          horariosBaseDoDia = horariosBaseDoDia.concat(
            gerarHorariosIntervalo(bloco.horaInicio, bloco.horaFim, duracaoSessao)
          );
        });
      } else {
        console.log(`DEBUG Backend - Nenhum bloco de horário encontrado para ${nomeDiaSemanaBanco}.`);
      }

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

      let horariosDisponiveis = horariosBaseDoDia.filter(hora => {
        const slotDateTime = parseISO(`${dataAtualISO}T${hora}:00`);
        const agoraComHora = new Date();

        if (isSameDay(dataAtual, agoraComHora)) {
            return isBefore(agoraComHora, slotDateTime);
        }
        return true; 
      });

      horariosDisponiveis = horariosDisponiveis.filter(hora => !horariosOcupados.includes(hora));

      slotsPorDia[dataAtualISO] = horariosDisponiveis;
      console.log(`DEBUG Backend - Slots para ${dataAtualISO} (${nomeDiaSemanaBanco}):`, horariosDisponiveis);
    }

    console.log('DEBUG Backend - Enviando resposta de slots disponíveis.');
    res.json({
      slotsPorDia,
      valorConsulta,
      duracaoConsulta: duracaoSessao,
      mensagem: "Slots carregados com sucesso."
    });
  } catch (error) {
    console.error('DEBUG Backend - Erro interno ao buscar slots disponíveis:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor ao buscar horários.' });
  }
};
// ...


export const solicitarAgendamento = async (req, res) => {
  try {
    console.log('DEBUG Backend - Recebendo solicitação de agendamento:');
    console.log('  req.body:', req.body);
    console.log('  req.usuario.id (clienteId do token):', req.usuario?.id);

    const {
      profissionalId: profissionalIdBody,
      profissional,
      data,
      horario,
      modalidade,
      valor,
      duracao,
      cliente
    } = req.body;

    const profissionalId = profissionalIdBody || profissional;
    const clienteId = req.usuario?.id || cliente;

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
      console.error('DEBUG Backend - Token inválido ou usuário não autenticado');
      return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
    }

    if (!profissionalId || !data || !horario || !modalidade || !valor || !duracao) {
      console.error('DEBUG Backend - Campos obrigatórios faltando (após ajuste):', {
        profissionalId,
        data,
        horario,
        modalidade,
        valor,
        duracao
      });
      return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios para solicitar agendamento.' });
    }

    const dataConsulta = new Date(data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (isBefore(dataConsulta, hoje)) {
      return res.status(400).json({ mensagem: 'Não é possível agendar para datas passadas.' });
    }

    const [hora, minuto] = horario.split(':');
    dataConsulta.setHours(parseInt(hora), parseInt(minuto), 0, 0);

    // ✅ CORREÇÃO: Adiciona verificação de horário passado no momento do agendamento
    const agoraComHora = new Date();
    if (isBefore(dataConsulta, agoraComHora)) {
        return res.status(400).json({ mensagem: 'Não é possível agendar para um horário que já passou.' });
    }

    const consultaExistente = await Consulta.findOne({
      profissionalId,
      data: {
        $gte: new Date(dataConsulta.getFullYear(), dataConsulta.getMonth(), dataConsulta.getDate(), 0, 0, 0),
        $lt: new Date(dataConsulta.getFullYear(), dataConsulta.getMonth(), dataConsulta.getDate(), 23, 59, 59, 999)
      },
      horario,
      statusConsulta: { $in: ['solicitada', 'confirmada', 'reagendamento_solicitado'] }
    });

    if (consultaExistente) {
      return res.status(409).json({ mensagem: 'Horário já ocupado.' });
    }

    const novaConsulta = new Consulta({
      clienteId,
      profissionalId,
      data: dataConsulta,
      horario,
      modalidade,
      valor,
      duracao,
      statusConsulta: 'solicitada',
      statusPagamento: 'pendente',
      historicoAcoes: []
    });

    adicionarHistorico(novaConsulta, 'Agendamento Solicitado', clienteId);
    await novaConsulta.save();

    console.log('DEBUG Backend - Agendamento criado com sucesso:', novaConsulta._id);
    res.status(201).json({ 
      mensagem: 'Agendamento solicitado com sucesso!', 
      consulta: {
        id: novaConsulta._id,
        profissionalId: novaConsulta.profissionalId,
        data: format(novaConsulta.data, 'dd/MM/yyyy', { locale: ptBR }),
        horario: novaConsulta.horario,
        modalidade: novaConsulta.modalidade,
        statusConsulta: novaConsulta.statusConsulta
      }
    });
  } catch (error) {
    console.error('Erro ao solicitar agendamento:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor ao solicitar agendamento.' });
  }
};

export const getAgendamentosCliente = async (req, res) => {
  try {
    const clienteId = req.usuario.id;
    const agendamentos = await Consulta.find({ clienteId })
      .populate('profissionalId', 'nome email infoProfissional')
      .sort({ data: -1, horario: 1 })
      .lean();

    const agendamentosFormatados = agendamentos.map(consulta => ({
      ...consulta,
      dataFormatada: format(new Date(consulta.data), 'dd/MM/yyyy', { locale: ptBR }),
      horaFormatada: consulta.horario,
      profissional: consulta.profissionalId
    }));

    res.json({ agendamentos: agendamentosFormatados });
  } catch (error) {
    console.error('Erro ao buscar agendamentos do cliente:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor ao buscar agendamentos.' });
  }
};

export const getAgendamentosProfissional = async (req, res) => {
  try {
    const profissionalId = req.usuario.id;
    const { status } = req.query;

    const filtroStatus = status ? { statusConsulta: status } : {};

    const agendamentos = await Consulta.find({ 
      profissionalId, 
      ...filtroStatus 
    })
      .populate('clienteId', 'nome email')
      .sort({ data: 1, horario: 1 })
      .lean();

    const agendamentosFormatados = agendamentos.map(consulta => ({
      ...consulta,
      dataFormatada: format(new Date(consulta.data), 'dd/MM/yyyy', { locale: ptBR }),
      horaFormatada: consulta.horario,
      cliente: consulta.clienteId
    }));

    res.json({ agendamentos: agendamentosFormatados });
  } catch (error) {
    console.error('Erro ao buscar agendamentos do profissional:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor ao buscar agendamentos.' });
  }
};

export const confirmarAgendamento = async (req, res) => {
  try {
    const { id } = req.params;
    const profissionalId = req.usuario.id;

    const consulta = await Consulta.findOneAndUpdate(
      { _id: id, profissionalId, statusConsulta: 'solicitada', statusPagamento: 'pago' },
      { $set: { statusConsulta: 'confirmada' } },
      { new: true }
    );

    if (!consulta) {
      return res.status(404).json({ mensagem: 'Agendamento não encontrado ou não está pendente/pago.' });
    }

    adicionarHistorico(consulta, 'Agendamento Confirmado', profissionalId);
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
    const usuarioId = req.usuario.id;
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
    const diffEmHoras = (dataConsulta.getTime() - agora.getTime()) / (1000 * 60 * 60);

    if (diffEmHoras < 24 && (isCliente || isProfissional)) {
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

export const clienteAceitaReagendamento = async (req, res) => {
  try {
    const { id } = req.params;
    const clienteId = req.usuario.id;

    const consulta = await Consulta.findOneAndUpdate(
      { _id: id, clienteId, statusConsulta: 'reagendamento_solicitado' },
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
      { _id: id, clienteId, statusConsulta: 'reagendamento_solicitado' },
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
      { _id: id, profissionalId, statusConsulta: 'confirmada', statusPagamento: 'pago' },
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
