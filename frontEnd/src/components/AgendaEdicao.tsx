import React, { useState, useEffect, useCallback } from "react";
import {
  format,
  addDays,
  startOfWeek,
  getDay,
  isSameDay,
  isBefore,
  startOfDay,
  parse,
  addMinutes,
} from "date-fns";
import { useAuth } from "../contextos/ContextoAutenticacao";
import api from "../services/api";
import "./AgendaEdicao.css";

interface HorarioDia {
  diaSemana: number;
  horarios: string[];
}

interface Excecao {
  data: string;
  horarios: string[];
  modalidade: "Online" | "Presencial";
}

interface DisponibilidadeProfissional {
  _id?: string;
  profissionalId: string;
  modalidade: "Online" | "Presencial";
  dias: HorarioDia[];
  excecoes: Excecao[];
}

interface Props {
  onClose?: () => void;
}

const diasSemanaMap: { [key: number]: string } = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

const AgendaEdicao: React.FC<Props> = ({ onClose }) => {
  const { token, usuario: usuarioLogado } = useAuth();

  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<
    "Online" | "Presencial" | ""
  >("");
  const [disponibilidade, setDisponibilidade] = useState<HorarioDia[]>([]);
  const [excecoes, setExcecoes] = useState<Excecao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [semanaInicio, ] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );

  // Gerador de Faixa
  const [faixaInicio, setFaixaInicio] = useState("09:00");
  const [faixaFim, setFaixaFim] = useState("17:00");
  const [faixaIntervalo, setFaixaIntervalo] = useState(60);
  const [faixaDiasSemana, setFaixaDiasSemana] = useState<number[]>([]);

  // Estados para exceção
  const [novaExcecaoData, setNovaExcecaoData] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [novaExcecaoHorarios, setNovaExcecaoHorarios] = useState("");
  const [novaExcecaoModalidade, setNovaExcecaoModalidade] = useState<
    "Online" | "Presencial" | ""
  >("");
  const [bloquearDiaInteiroExcecao, setBloquearDiaInteiroExcecao] =
    useState(false);

  // ================= BUSCAR DISPONIBILIDADE EXISTENTE =================
  const buscarDisponibilidade = useCallback(
    async (modalidade: "Online" | "Presencial") => {
      if (!token || !usuarioLogado?._id || !modalidade) return;

      setCarregando(true);
      setErro(null);
      try {
        const response = await api.get(
          `/agendamentos/disponibilidade/${usuarioLogado._id}/${modalidade}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const { disponibilidade: fetched } = response.data;
        setDisponibilidade(fetched?.dias || []);
        setExcecoes(fetched?.excecoes || []);
        setMensagemSucesso("Disponibilidade carregada com sucesso!");
      } catch (e: any) {
        console.error("Erro ao buscar disponibilidade:", e);
        if (e.response?.status === 404) {
          setMensagemSucesso(
            "Nenhuma disponibilidade configurada. Comece adicionando novos horários."
          );
          setDisponibilidade([]);
          setExcecoes([]);
        } else {
          setErro(e.response?.data?.mensagem || "Erro ao carregar disponibilidade.");
        }
      } finally {
        setCarregando(false);
      }
    },
    [token, usuarioLogado?._id]
  );

  // Carrega automaticamente quando muda a modalidade
  useEffect(() => {
    if (modalidadeSelecionada === "Online" || modalidadeSelecionada === "Presencial") {
      buscarDisponibilidade(modalidadeSelecionada);
    }
  }, [modalidadeSelecionada, buscarDisponibilidade]);

  // ================= FUNÇÕES DE EDIÇÃO DE SLOTS =================

  // Adicionar faixa de horários (com proteção contra duplicados)
  const gerarSlotsFaixa = useCallback(() => {
    if (faixaDiasSemana.length === 0) return;

    const inicio = parse(faixaInicio, "HH:mm", new Date());
    const fim = parse(faixaFim, "HH:mm", new Date());

    const slotsGerados: string[] = [];
    let current = inicio;

    while (isBefore(current, fim)) {
      slotsGerados.push(format(current, "HH:mm"));
      current = addMinutes(current, faixaIntervalo);
    }

    setDisponibilidade((prev) => {
      const novoEstado = [...prev];
      faixaDiasSemana.forEach((dSemana) => {
        const diaExistente = novoEstado.find((d) => d.diaSemana === dSemana);
        if (diaExistente) {
          const novos = Array.from(
            new Set([...diaExistente.horarios, ...slotsGerados])
          ).sort();
          diaExistente.horarios = novos;
        } else {
          novoEstado.push({ diaSemana: dSemana, horarios: slotsGerados });
        }
      });
      return novoEstado.sort((a, b) => a.diaSemana - b.diaSemana);
    });

    setMensagemSucesso("Faixa de horários gerada com sucesso!");
  }, [faixaInicio, faixaFim, faixaIntervalo, faixaDiasSemana]);

  // Remoção de slots padrão e exceções
  const removerSlotPadrao = useCallback((diaSemana: number, horario: string) => {
    setDisponibilidade((prev) =>
      prev.map((d) =>
        d.diaSemana === diaSemana
          ? { ...d, horarios: d.horarios.filter((h) => h !== horario) }
          : d
      )
    );
  }, []);

  const removerExcecaoDeHorario = useCallback(
    (data: string, horario: string) => {
      setExcecoes((prev) =>
        prev.map((exc) =>
          exc.data === data
            ? { ...exc, horarios: exc.horarios.filter((h) => h !== horario) }
            : exc
        )
      );
    },
    []
  );

  // Adicionar exceção
  const adicionarExcecao = useCallback(() => {
    if (!novaExcecaoModalidade) return;
    const horarios = bloquearDiaInteiroExcecao
      ? []
      : novaExcecaoHorarios
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean);

    setExcecoes((prev) => {
      const jaExiste = prev.find(
        (e) => e.data === novaExcecaoData && e.modalidade === novaExcecaoModalidade
      );
      if (jaExiste) {
        const novosHorarios = Array.from(
          new Set([...jaExiste.horarios, ...horarios])
        ).sort();
        return prev.map((ex) =>
          ex.data === novaExcecaoData && ex.modalidade === novaExcecaoModalidade
            ? { ...ex, horarios: novosHorarios }
            : ex
        );
      } else {
        return [
          ...prev,
          { data: novaExcecaoData, horarios, modalidade: novaExcecaoModalidade },
        ];
      }
    });

    setNovaExcecaoHorarios("");
    setBloquearDiaInteiroExcecao(false);
    setMensagemSucesso("Exceção adicionada com sucesso!");
  }, [novaExcecaoData, novaExcecaoHorarios, bloquearDiaInteiroExcecao, novaExcecaoModalidade]);

  // ================= SALVAR DISPONIBILIDADE =================
  const handleSalvar = async () => {
    if (!token || !usuarioLogado?._id || !modalidadeSelecionada) {
      setErro("Modalidade e ID do profissional são obrigatórios.");
      return;
    }

    setCarregando(true);
    setErro(null);
    setMensagemSucesso(null);

    try {
      const payload: DisponibilidadeProfissional = {
        profissionalId: usuarioLogado._id,
        modalidade: modalidadeSelecionada,
        dias: disponibilidade,
        excecoes,
      };

      await api.post("/agendamentos/disponibilidade", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMensagemSucesso("Horários salvos com sucesso!");
      buscarDisponibilidade(modalidadeSelecionada);
      onClose?.(); // fecha a janela
    } catch (e: any) {
      console.error("Erro ao salvar disponibilidade:", e);
      setErro(e.response?.data?.mensagem || "Erro ao salvar disponibilidade.");
    } finally {
      setCarregando(false);
    }
  };

  // ================== RENDER GRID EDITÁVEL ==================
  const renderGridEdicao = useCallback(() => {
    const diasDaSemana = Array.from({ length: 7 }).map((_, i) =>
      addDays(semanaInicio, i)
    );
    const hoje = startOfDay(new Date());

    return diasDaSemana.map((date) => {
      const dataISO = format(date, "yyyy-MM-dd");
      const diaSemanaNum = getDay(date);
      const isDiaPassado = isBefore(date, hoje) && !isSameDay(date, hoje);

      const horariosPadrao =
        disponibilidade.find((d) => d.diaSemana === diaSemanaNum)?.horarios ||
        [];
      const excecaoParaData = excecoes.find(
        (ex) => ex.data === dataISO && ex.modalidade === modalidadeSelecionada
      );
      const horariosDoDia = excecaoParaData
        ? excecaoParaData.horarios
        : horariosPadrao;

      return (
        <div
          key={dataISO}
          className={`dia-agenda-edicao ${isDiaPassado ? "passado" : ""}`}
        >
          <div className="dia-header-edicao">
            <span className="dia-nome-edicao">{diasSemanaMap[diaSemanaNum]}</span>
            <span className="dia-data-edicao">{format(date, "dd/MM")}</span>
          </div>
          <div className="horarios-lista-edicao">
            {horariosDoDia.length > 0 ? (
              horariosDoDia.map((horario) => (
                <div key={horario} className="slot-edicao-item">
                  <span>{horario}</span>
                  <button
                    className="btn-remover-slot"
                    onClick={() => {
                      if (excecaoParaData) {
                        removerExcecaoDeHorario(dataISO, horario);
                      } else {
                        removerSlotPadrao(diaSemanaNum, horario);
                      }
                    }}
                    disabled={isDiaPassado || carregando}
                  >
                    X
                  </button>
                </div>
              ))
            ) : (
              <p className="sem-horarios-edicao">
                {excecaoParaData && excecaoParaData.horarios.length === 0
                  ? "Dia bloqueado"
                  : "Sem horários configurados"}
              </p>
            )}
          </div>
        </div>
      );
    });
  }, [
    semanaInicio,
    disponibilidade,
    excecoes,
    modalidadeSelecionada,
    removerSlotPadrao,
    removerExcecaoDeHorario,
    carregando,
  ]);

  // ================== RENDER RETURN ==================
  return (
    <div className="agenda-modal-overlay">
      <div className="pagina-edicao-agenda">
        <header className="header-edicao-agenda">
          <h2>Editar Horários Disponíveis</h2>
          <button className="btn-fechar-topo" onClick={onClose}>
            Fechar
          </button>
        </header>

        {erro && <p className="mensagem-erro">{erro}</p>}
        {mensagemSucesso && <p className="mensagem-sucesso">{mensagemSucesso}</p>}

        <div className="layout-edicao-agenda">
          <aside className="painel-config-horarios">
            <div className="bloco-config">
              <h4>Modalidade</h4>
              <select
                value={modalidadeSelecionada}
                onChange={(e) =>
                  setModalidadeSelecionada(e.target.value as "Online" | "Presencial" | "")
                }
                disabled={carregando}
              >
                <option value="">Selecione a Modalidade</option>
                <option value="Online">Online</option>
                <option value="Presencial">Presencial</option>
              </select>
            </div>

            {modalidadeSelecionada && (
              <>
                <div className="bloco-config">
                  <h4>Gerar Faixa de Horários</h4>
                  <label htmlFor="inicio">Início:</label>
                  <input
                    type="time"
                    id="inicio"
                    value={faixaInicio}
                    onChange={(e) => setFaixaInicio(e.target.value)}
                  />

                  <label htmlFor="fim">Fim:</label>
                  <input
                    type="time"
                    id="fim"
                    value={faixaFim}
                    onChange={(e) => setFaixaFim(e.target.value)}
                  />

                  <label htmlFor="intervalo">Intervalo (minutos):</label>
                  <input
                    type="number"
                    id="intervalo"
                    min={15}
                    value={faixaIntervalo}
                    onChange={(e) => setFaixaIntervalo(Number(e.target.value))}
                  />

                  <label>Aplicar aos dias:</label>
                  <div className="dias-checkbox-group">
                    {Object.entries(diasSemanaMap).map(([num, nome]) => (
                      <label key={num}>
                        <input
                          type="checkbox"
                          value={num}
                          checked={faixaDiasSemana.includes(Number(num))}
                          onChange={(e) => {
                            const n = Number(num);
                            setFaixaDiasSemana((prev) =>
                              e.target.checked
                                ? [...prev, n]
                                : prev.filter((d) => d !== n)
                            );
                          }}
                        />
                        {nome}
                      </label>
                    ))}
                  </div>
                  <button className="btn-gerar-faixa" onClick={gerarSlotsFaixa}>
                    Gerar Horários
                  </button>
                </div>

                <div className="bloco-config">
                  <h4>Gerenciar Exceções</h4>
                  <label>Data:</label>
                  <input
                    type="date"
                    value={novaExcecaoData}
                    onChange={(e) => setNovaExcecaoData(e.target.value)}
                  />

                  <label>Modalidade:</label>
                  <select
                    value={novaExcecaoModalidade}
                    onChange={(e) =>
                      setNovaExcecaoModalidade(
                        e.target.value as "Online" | "Presencial" | ""
                      )
                    }
                  >
                    <option value="">Selecione</option>
                    <option value="Online">Online</option>
                    <option value="Presencial">Presencial</option>
                  </select>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={bloquearDiaInteiroExcecao}
                      onChange={(e) =>
                        setBloquearDiaInteiroExcecao(e.target.checked)
                      }
                    />
                    Bloquear dia inteiro
                  </label>

                  {!bloquearDiaInteiroExcecao && (
                    <>
                      <label>Horários (HH:MM, separados por vírgula)</label>
                      <input
                        type="text"
                        placeholder="09:00, 10:00, 11:00"
                        value={novaExcecaoHorarios}
                        onChange={(e) =>
                          setNovaExcecaoHorarios(e.target.value)
                        }
                      />
                    </>
                  )}
                  <button className="btn-adicionar-excecao" onClick={adicionarExcecao}>
                    Adicionar Exceção
                  </button>
                </div>
              </>
            )}

            <div className="botoes-footer-config">
              <button
                className="btn-salvar-agenda"
                onClick={handleSalvar}
                disabled={carregando || !modalidadeSelecionada}
              >
                Salvar horários
              </button>
              <button className="btn-cancelar-modal" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </aside>

          <section className="grid-horarios-edicao">
            {modalidadeSelecionada ? (
              <div className="dias-agenda-container-edicao">
                {renderGridEdicao()}
              </div>
            ) : (
              <p className="selecione-modalidade-aviso">
                Selecione uma modalidade para começar a editar.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AgendaEdicao;
