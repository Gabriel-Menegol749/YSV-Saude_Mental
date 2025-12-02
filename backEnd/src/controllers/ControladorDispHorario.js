import Disponibilidade from '../models/DisponibilidadeHorarios.js';
import Usuario from '../models/Usuarios.js';
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
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export const getDisponibilidade = async (req, res) => {
  try {
    const { profissionalId } = req.params;
    const { dataInicio, modalidade } = req.query; // vem da Agenda.tsx

    console.log('--- INÍCIO getDisponibilidade ---');
    console.log('Parâmetros recebidos:', { profissionalId, dataInicio, modalidade });

    if (!modalidade || (modalidade !== 'Online' && modalidade !== 'Presencial')) {
      console.log('ERRO: Modalidade inválida ou não fornecida:', modalidade);
      return res
        .status(400)
        .json({ mensagem: 'Modalidade inválida ou não fornecida.' });
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
          'Nenhuma configuração de disponibilidade encontrada para esta modalidade.',
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
    const hoje = startOfDay(new Date());

    // 4. Gerar slots para 7 dias
    for (let i = 0; i < 7; i++) {
      const dataAtual = addDays(inicioDaSemana, i);
      const dataISO = format(dataAtual, 'yyyy-MM-dd');

      // ✅ CORREÇÃO: Mapeia o nome completo do dia para o formato curto do seu MongoDB
      const diaSemanaNomeCompleto = format(dataAtual, 'EEEE', { locale: ptBR }); // ex: "terça-feira"
      const mapaDiaSemana = {
        'domingo': 'Domingo',
        'segunda-feira': 'Segunda',
        'terça-feira': 'Terça',
        'quarta-feira': 'Quarta',
        'quinta-feira': 'Quinta',
        'sexta-feira': 'Sexta',
        'sábado': 'Sábado',
      };
      const diaSemanaFormatado =
        mapaDiaSemana[diaSemanaNomeCompleto.toLowerCase()] || diaSemanaNomeCompleto; // Fallback caso não encontre

      console.log(`Processando dia: ${dataISO} (${diaSemanaFormatado})`);

      // Ignora dias passados
      if (isBefore(dataAtual, hoje) && !isSameDay(dataAtual, hoje)) {
        console.log(`Dia ${dataISO} é passado, ignorando.`);
        slotsPorDia[dataISO] = [];
        continue;
      }

      // Encontra config para este dia
      const diaConfig = configDisponibilidade.dias.find(
        (d) => d.diaSemana === diaSemanaFormatado
      );
      console.log(`Configuração para ${diaSemanaFormatado}:`, diaConfig);

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
        console.log(`Nenhum bloco de horário encontrado para ${diaSemanaFormatado}.`);
      }

      // 5. Aplicar exceções
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

      slotsPorDia[dataISO] = slotsDoDia;
    }

    console.log('Slots gerados para resposta:', slotsPorDia);
    console.log('--- FIM getDisponibilidade (SUCESSO) ---');

    return res.status(200).json({
      slotsPorDia,
      valorConsulta,
      duracaoConsulta,
    });
  } catch (error) {
    console.error('--- ERRO NO getDisponibilidade ---');
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

    if (modalidade === 'Híbrido') {
      return res
        .status(400)
        .json({ mensagem: 'A modalidade Híbrido não é mais suportada.' });
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
