import React, { useEffect, useState, useCallback } from "react";
import { format, addDays, startOfWeek, isSameDay, getDay, isPast, isBefore, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../contextos/ContextoAutenticacao";
import "./Agenda.css";

interface SlotsDisponiveis {
  slotsPorDia: { [dataISO: string]: string[] };
  valorConsulta: number;
  duracao_Sessao: number;
  mensagem?: string;
}

interface Props {
  profissionalId: string;
  modalidade: 'Online' | 'Presencial';
}

const API_BASE_URL = "http://localhost:5000";

const diasSemanaMap: { [key: number]: string } = {
  0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado'
};

const Agenda: React.FC<Props> = ({ profissionalId, modalidade }) => {
  const { token } = useAuth();
  const [semanaInicio, setSemanaInicio] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [slotsData, setSlotsData] = useState<SlotsDisponiveis | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string>("");
  const [slotSelecionado, setSlotSelecionado] = useState<{
    date: Date | null;
    horario: string | null;
  }>({ date: null, horario: null });

  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<'Online' | 'Presencial' | 'Híbrido'>(modalidade);

  useEffect(() => {
    setModalidadeSelecionada(modalidade);
  }, [modalidade]);

  const buscarSlots = useCallback(
    async (dataInicio: Date, currentModalidade: 'Online' | 'Presencial' | 'Híbrido') => {
      setCarregando(true);
      setErro("");
      try {
        const dataISO = format(dataInicio, "dd-MM-yyyy");
        const url = `${API_BASE_URL}/api/agendamentos/slots/${profissionalId}?dataInicio=${dataISO}&modalidade=${currentModalidade}`;
        const res = await fetch(url);
        const rawResponse = await res.text();

        let data: SlotsDisponiveis;
        try {
          data = JSON.parse(rawResponse);
        } catch (jsonError) {
          throw new Error(rawResponse || "Resposta inválida do servidor.");
        }

        if (!res.ok) {
          throw new Error(data.mensagem || "Falha ao carregar a agenda.");
        }

        setSlotsData(data);
      } catch (e: any) {
        setErro(e.message || "Erro ao buscar horários.");
        setSlotsData(null);
      } finally {
        setCarregando(false);
      }
    },
    [profissionalId]
  );

  useEffect(() => {
    buscarSlots(semanaInicio, modalidadeSelecionada);
  }, [semanaInicio, modalidadeSelecionada, buscarSlots]);

  const mudarSemana = (offset: number) => {
    setSemanaInicio((prev) => addDays(prev, offset));
    setSlotSelecionado({ date: null, horario: null });
  };

  const handleAgendar = async () => {

if (!slotSelecionado.date || !slotSelecionado.horario || !token || !slotsData || slotsData.valorConsulta === undefined || slotsData.duracao_Sessao === undefined) {
      setErro("Por favor, selecione um horário para agendar e certifique-se de estar logado.");
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const dataConsulta = format(slotSelecionado.date, 'yyyy-MM-dd');
      const horario = slotSelecionado.horario;
      const valor = slotsData.valorConsulta;
      const duracao = slotsData.duracao_Sessao;

      const res = await fetch(`${API_BASE_URL}/api/agendamentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          profissionalId,
          data: dataConsulta,
          horario,
          modalidade: modalidadeSelecionada,
          valor,
          duracao
        }),
      });

      const rawResponse = await res.text();
      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch (jsonError) {
        throw new Error(rawResponse || "Resposta inválida do servidor ao solicitar agendamento.");
      }

      if (!res.ok) {
        throw new Error(data.mensagem || "Falha ao solicitar agendamento.");
      }

      alert("Solicitação de agendamento enviada com sucesso!");
      setSlotSelecionado({ date: null, horario: null }); // Limpa a seleção após o agendamento
      buscarSlots(semanaInicio, modalidadeSelecionada); // Recarrega os slots para atualizar o estado
    } catch (e: any) {
      console.error("Erro ao solicitar agendamento:", e);
      setErro(e.message || "Erro ao solicitar agendamento.");
    } finally {
      setCarregando(false);
    }
  };

  // Função para renderizar os slots de horários para cada dia
  const renderSlots = () => {
    // Cria um array de 7 dias começando da semanaInicio
    const diasParaExibir = Array.from({ length: 7 }).map((_, i) =>
      addDays(semanaInicio, i)
    );

    // Exibe mensagens de carregamento ou erro
    if (carregando && !slotsData) { // Mostra carregando apenas se ainda não houver dados
      return <div className="loading-message">Carregando horários...</div>;
    }

    if (erro && !slotsData) { // Mostra erro apenas se não houver dados
      return <div className="erro-agenda">{erro}</div>;
    }

    // Mapeia cada dia para renderizar sua coluna de slots
    return diasParaExibir.map((date) => {
      const dataISO = format(date, "yyyy-MM-dd"); // Formato ISO para buscar no slotsData
      const diaSemanaNome = diasSemanaMap[getDay(date)]; // Nome do dia da semana (ex: "Domingo")
      const slotsLivres = slotsData?.slotsPorDia?.[dataISO] || []; // Slots disponíveis para este dia
      const hoje = startOfDay(new Date()); // Começo do dia atual para comparação
      const isDiaPassado = isBefore(date, hoje) && !isSameDay(date, hoje); // Verifica se o dia já passou

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

                // Verifica se o slot já passou (para o dia atual)
                const slotDateTime = parseISO(`${dataISO}T${hora}:00`);
                const agora = new Date();
                const isSlotPassado = isBefore(slotDateTime, agora);

                return (
                  <button
                    key={hora}
                    // ✅ CORREÇÃO: Usar classes CSS para estilizar slots disponíveis/selecionados/passados
                    className={`slot-card
                                ${isSelecionado ? "slot-card--selecionado" : ""}
                                ${isSlotPassado ? "slot-card--passado" : "slot-card--disponivel"}`}
                    disabled={carregando || isDiaPassado || isSlotPassado} // Desabilita se carregando, dia passado ou slot passado
                    onClick={() => !isDiaPassado && !isSlotPassado && setSlotSelecionado({ date, horario: hora })} // Permite selecionar se não passou
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

  // Renderização principal do componente
  return (
    <div className="agenda-wrapper">
      <div className="agenda-card">
        {/* Header verde */}
        <div className="agenda-header">
          <h3 className="agenda-title">Horários Disponíveis</h3>
          {/* Botões de modalidade */}
          <div className="selectModalidade">
            <select
              className="modalidade-select"
              value={modalidadeSelecionada}
              onChange={(e) => setModalidadeSelecionada(e.target.value as "Online" | "Presencial")}
            >
              <option value="Online">Online</option>
              <option value="Presencial">Presencial</option>
            </select>
          </div>

        </div>
        {/* Barra cinza "Escolha uma data" */}
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
              {format(addDays(semanaInicio, 6), "d MMM yyyy", { locale: ptBR })} {/* ✅ CORREÇÃO: Exibir até o 7º dia */}
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
        {/* Grade de dias/horários */}
        <div className="dias-agenda-container">{renderSlots()}</div>
        {/* Botão agendar */}
        <div className="agenda-footer">
          <button
            className="agenda-cta"
            onClick={handleAgendar}
            disabled={!slotSelecionado.date || !slotSelecionado.horario || carregando || !token} // ✅ CORREÇÃO: Verifica slotSelecionado.horario também
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
