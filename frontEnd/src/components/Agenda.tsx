import React, { useEffect, useState, useCallback } from "react";
import { format, addDays, startOfWeek, isSameDay, getDay, isBefore, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../contextos/ContextoAutenticacao";
import api from '../services/api.ts'
import "./Agenda.css";

interface SlotsDisponiveis {
  slotsPorDia: { [dataISO: string]: string[] };
  valorConsulta: number;
  duracaoConsulta: number;
  mensagem?: string;
}

interface Props {
  profissionalId: string;
  modalidade: 'Online' | 'Presencial' | '';
}

const diasSemanaMap: { [key: number]: string } = {
  0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado'
};

const Agenda: React.FC<Props> = ({ profissionalId, modalidade }) => {
  const { token, usuario: usuarioLogado } = useAuth();
  const [semanaInicio, setSemanaInicio] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [slotsData, setSlotsData] = useState<SlotsDisponiveis | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string>("");
  const [, setMensagemSucesso] = useState<string | null>(null);
  const [slotSelecionado, setSlotSelecionado] = useState<{
    date: Date | null;
    horario: string | null;
  }>({ date: null, horario: null });
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<'Online' | 'Presencial' | ''>(
    modalidade === 'Online' || modalidade === 'Presencial' ? modalidade : ''
  );

  useEffect(() => {
    setModalidadeSelecionada(modalidade === 'Online' || modalidade === 'Presencial' ? modalidade : '');
  }, [modalidade]);

  const buscarSlots = useCallback(
    async (inicioDaSemana: Date, modalidadeAtual: 'Online' | 'Presencial' | '') => {
      setCarregando(true);
      setErro("");
      setMensagemSucesso(null);

      if (!profissionalId || !modalidadeAtual || (modalidadeAtual !== 'Online' && modalidadeAtual !== 'Presencial')) {
        setErro("Por favor, selecione uma modalidade válida (Online ou Presencial) e certifique-se de que o ID do profissional está disponível.");
        setCarregando(false);
        setSlotsData(null);
        return;
      }

      try {
        const dataInicioFormatada = format(inicioDaSemana, 'dd-MM-yyyy');
        const response = await api.get(`/agendamentos/${profissionalId}/slots`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            dataInicio: dataInicioFormatada,
            modalidade: modalidadeAtual,
          },
        });
        setSlotsData(response.data);
        setMensagemSucesso("Slots carregados com sucesso!");
      } catch (e: any) {
        console.error("Erro ao buscar slots:", e);
        setErro(e.response?.data?.mensagem || "Erro desconhecido ao buscar slots. Verifique o console para mais detalhes.");
        setSlotsData(null);
      } finally {
        setCarregando(false);
      }
    },
    [profissionalId, token]
  );

  useEffect(() => {
    if (profissionalId && modalidadeSelecionada) {
      buscarSlots(semanaInicio, modalidadeSelecionada);
    } else if (!modalidadeSelecionada) {
      setSlotsData(null);
      setErro("Por favor, selecione uma modalidade para ver os horários.");
    }
  }, [semanaInicio, profissionalId, modalidadeSelecionada, token, buscarSlots]);

  const mudarSemana = (offset: number) => {
    setSemanaInicio((prev) => addDays(prev, offset));
    setSlotSelecionado({ date: null, horario: null });
  };

  const handleAgendar = async () => {
    if (!slotSelecionado.date || !slotSelecionado.horario || !token || !usuarioLogado || !slotsData || !modalidadeSelecionada) {
      setErro("Todos os campos são obrigatórios para solicitar agendamento.");
      return;
    }

    if (slotsData.valorConsulta === undefined || slotsData.duracaoConsulta === undefined) {
        setErro("Informações de valor ou duração da consulta não disponíveis. Por favor, verifique o perfil do profissional.");
        return;
    }
    setCarregando(true);
    setErro("");
    try {
      const dataAgendamento = format(slotSelecionado.date, 'yyyy-MM-dd');
      const horarioAgendamento = slotSelecionado.horario;

      await api.post('/agendamentos', {
        profissional: profissionalId,
        cliente: usuarioLogado._id,
        data: dataAgendamento,
        horario: horarioAgendamento,
        modalidade: modalidadeSelecionada,
        valor: slotsData.valorConsulta,
        duracao: slotsData.duracaoConsulta,
        statusConsulta: 'solicitada',
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMensagemSucesso("Consulta solicitada com sucesso!");
      setErro("");
      setSlotSelecionado({ date: null, horario: null });
      buscarSlots(semanaInicio, modalidadeSelecionada); // Recarrega slots
    } catch (e: any) {
      console.error("Erro ao agendar consulta:", e);
      if (e.response && e.response.data && e.response.data.mensagem) {
        setErro(e.response.data.mensagem);
      } else {
        setErro("Erro ao agendar consulta. Tente novamente.");
      }
      buscarSlots(semanaInicio, modalidadeSelecionada);
    } finally {
      setCarregando(false);
    }
  };

  const renderSlots = () => {
    const diasParaExibir = Array.from({ length: 7 }).map((_, i) =>
      addDays(semanaInicio, i)
    );
    return diasParaExibir.map((date) => {
      const dataISO = format(date, "yyyy-MM-dd");
      const diaSemanaNome = diasSemanaMap[getDay(date)]; // Usa o mapa de dias curtos
      const slotsLivres = slotsData?.slotsPorDia?.[dataISO] || [];
      const hoje = startOfDay(new Date());
      const isDiaPassado = isBefore(date, hoje) && !isSameDay(date, hoje);
      return (
        <div key={dataISO} className="dia-coluna">
          <div className="dia-header">
            <span className="dia-nome">{diaSemanaNome}</span> <br/>
            <span className="dia-data">{format(date, "dd/MM")}</span>
          </div>
          <div className="horarios-lista">
            {slotsLivres.length > 0 ? (
              slotsLivres.map((hora) => {
                const isSelecionado =
                  slotSelecionado.date &&
                  isSameDay(slotSelecionado.date, date) &&
                  slotSelecionado.horario === hora;

                const slotDateTime = parseISO(`${dataISO}T${hora}:00`);
                const agora = new Date();
                const isSlotPassado = isBefore(slotDateTime, agora);

                return (
                  <button
                    key={hora}
                    className={`slot-card
                                ${isSelecionado ? "slot-card--selecionado" : ""}
                                ${isSlotPassado ? "slot-card--passado" : "slot-card--disponivel"}`}
                    disabled={carregando || isDiaPassado || isSlotPassado}
                    onClick={() => {
                      if (!isDiaPassado && !isSlotPassado) {
                        setSlotSelecionado({ date: slotDateTime, horario: hora });
                      }
                    }}
                  >
                    {hora}
                  </button>
                );
              })
            ) : (
              <p className="sem-horarios">Sem <br/>horários</p>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="agenda-wrapper">
      <div className="agenda-card">
        <div className="agenda-header">
          <h3 className="agenda-title">Horários Disponíveis</h3>
          <div className="selectModalidade">
            <select
              className="modalidade-select"
              value={modalidadeSelecionada}
              onChange={(e) => setModalidadeSelecionada(e.target.value as "Online" | "Presencial" | "")}
            >
              <option value="">Selecione uma modalidade</option>
              <option value="Online">Online</option>
              <option value="Presencial">Presencial</option>
            </select>
          </div>
        </div>
        <div className="agenda-periodo-bar">
          <div className="agenda-periodo-labels">
            <span className="agenda-subtitle">Escolha uma data</span>
            <p className="agenda-periodo-text">
              A partir de:{" "}
              {format(semanaInicio, "d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="agenda-periodo-nav">
            <button
              className="nav-btn"
              onClick={() => mudarSemana(-7)}
              disabled={carregando}
            >
              {"<"}
            </button>
            <span className="periodo-span">
              {format(semanaInicio, "d MMM", { locale: ptBR })} -{" "}
              {format(addDays(semanaInicio, 6), "d MMM yyyy", { locale: ptBR })}
            </span>
            <button
              className="nav-btn"
              onClick={() => mudarSemana(7)}
              disabled={carregando}
            >
              {">"}
            </button>
          </div>
        </div>
        <div className="dias-agenda-container">{renderSlots()}</div>
        <div className="agenda-footer">
          <button
            className="agenda-cta"
            onClick={handleAgendar}
            disabled={!slotSelecionado.date || !slotSelecionado.horario || carregando || !token || !modalidadeSelecionada}
          >
            {carregando ? "Enviando..." : "Agendar uma Consulta"}
          </button>
          {erro && <p className="erro-solicitar">{erro}</p>}
        </div>
      </div>
    </div>
  );
};

export default Agenda;
