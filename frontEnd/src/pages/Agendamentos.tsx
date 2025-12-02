import  { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../contextos/ContextoAutenticacao";
import fotoPefilPadrao from "../assets/profile-circle-svgrepo-com.svg";

import "./Agendamentos.css";
import api from '../services/api.ts'

const getMediaBaseUrl = () => {
    const currentBaseUrl = api.defaults.baseURL || '';
    if (currentBaseUrl.endsWith('/api')) {
        return currentBaseUrl.substring(0, currentBaseUrl.length - 4);
    }
    return currentBaseUrl;
};

// Interfaces (Mantenha as suas, mas adicione 'historicoAcoes' se tiver no model)
interface UsuarioPopulado {
  _id: string;
  nome: string;
  fotoPerfil?: string;
  infoProfissional?: {
    profissao?: string;
    crp?: string;
  };
}
interface Consulta {
  _id: string;
  clienteId: string | UsuarioPopulado;
  profissionalId: string | UsuarioPopulado;
  data: string;
  horario: string;
  modalidade: string;
  valor: number;
  duracao: number;
  statusPagamento: string;
  statusConsulta:
    | "solicitada"
    | "confirmada"
    | "recusada"
    | "cancelada"
    | "reagendamento_solicitado"
    | "reagendamento_aceito_cliente"
    | "reagendamento_recusado_cliente"
    | "paga"
    | "finalizada";
  historicoAcoes: any[];
  novaDataProposta?: string;
  novoHorarioProposto?: string;
}

const Agendamentos = () => {
  const { token, usuario } = useAuth(); // Pega o objeto usuario do contexto
  const [solicitacoes, setSolicitacoes] = useState<Consulta[]>([]);
  const [consultasConfirmadas, setConsultasConfirmadas] = useState<Consulta[]>(
    []
  );
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string>("");

  const ehProfissional = usuario?.tipoUsuario === "Profissional";

  const formatarDataHora = (dataStr: string, horarioStr: string) => {
    const data = parseISO(dataStr);
    return `${format(data, "dd/MM/yyyy", { locale: ptBR })} às ${horarioStr}`;
  };

  const fetchAgendamentos = useCallback(async () => {
    if (!token) {
      setErro("Faça login para ver seus agendamentos.");
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErro("");
    try {
        const res = await fetch(`${getMediaBaseUrl()}/api/agendamentos/usuario`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      const raw = await res.text();
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(raw || "Resposta inválida do servidor.");
      }

      if (!res.ok) {
        throw new Error(data.mensagem || "Erro ao buscar agendamentos.");
      }

      console.log("Resposta bruta /api/agendamentos/usuario:", res.status, data); // Log para depuração
      setSolicitacoes(data.solicitacoes || []);
      setConsultasConfirmadas(data.consultasConfirmadas || []);
    } catch (e: any) {
      console.error("Erro ao buscar agendamentos:", e);
      setErro(e.message || "Erro ao buscar agendamentos.");
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos]);

const getUsuarioOutroLado = (consulta: Consulta): UsuarioPopulado | null => {
  if (ehProfissional) {
    const outro = typeof consulta.clienteId === "string"
      ? null
      : (consulta.clienteId as UsuarioPopulado);
    console.log("Outro usuário (profissional vendo cliente):", outro);
    return outro;
  } else {
    const outro = typeof consulta.profissionalId === "string"
      ? null
      : (consulta.profissionalId as UsuarioPopulado);
    console.log("Outro usuário (cliente vendo profissional):", outro);
    return outro;
  }
};

const getFoto = (user: UsuarioPopulado | null) => {
    if (user?.fotoPerfil) {
      return `${getMediaBaseUrl()}${user.fotoPerfil}`;
    }
    return fotoPefilPadrao; // Retorna a imagem padrão se não houver foto
  };

  const handleAcao = async (
    consultaId: string,
    novaAcao:
      | "aceitar"
      | "recusar"
      | "reagendar"
      | "cancelar"
      | "pagar"
      | "reagendar/aceitar" // Cliente aceita reagendamento
      | "reagendar/recusar" // Cliente recusa reagendamento
  ) => {
    if (!token) {
      alert("Você precisa estar logado para realizar esta ação.");
      return;
    }
    try {
      let url = `${getMediaBaseUrl()}/api/agendamentos/${consultaId}/${novaAcao}`;
      let body: any = undefined;

      if (novaAcao === "reagendar") {
        const novaData = window.prompt(
          "Informe a nova data para o agendamento (formato YYYY-MM-DD):",
          ""
        );
        const novoHorario = window.prompt(
          "Informe o novo horário (formato HH:mm):",
          ""
        );
        if (!novaData || !novoHorario) {
          alert("Reagendamento cancelado: nova data e horário são obrigatórios.");
          return;
        }
        body = JSON.stringify({ novaData, novoHorario });
      }

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });
      const raw = await res.text();
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(raw || "Resposta inválida do servidor.");
      }

      if (!res.ok) {
        throw new Error(data.mensagem || "Erro ao atualizar agendamento.");
      }

      alert(data.mensagem || "Ação realizada com sucesso.");
      fetchAgendamentos(); // Recarrega a lista após a ação
    } catch (e: any) {
      console.error("Erro ao executar ação no agendamento:", e);
      alert(e.message || "Erro ao executar ação.");
    }
  };

  const renderBotoesAcao = (consulta: Consulta) => {
    const { statusConsulta, statusPagamento } = consulta;

    // Ações para PROFISSIONAIS
    if (ehProfissional) {
      switch (statusConsulta) {
        case "solicitada":
          return (
            <>
              <button
                className="AceitarAgendamento"
                onClick={() => handleAcao(consulta._id, "aceitar")}
              >
                Aceitar Agendamento
              </button>
              <button
                className="RecusarAgendamento"
                onClick={() => handleAcao(consulta._id, "recusar")}
              >
                Recusar Agendamento
              </button>
              <button
                className="ReagendarAgendamento"
                onClick={() => handleAcao(consulta._id, "reagendar")}
              >
                Reagendar Agendamento
              </button>
            </>
          );
        case "confirmada":
        case "paga":
          return (
            <>
              <button
                className="ReagendarAgendamento"
                onClick={() => handleAcao(consulta._id, "reagendar")}
              >
                Reagendar Agendamento
              </button>
              <button
                className="RecusarAgendamento" // Profissional pode recusar mesmo depois de confirmar
                onClick={() => handleAcao(consulta._id, "recusar")}
              >
                Recusar Agendamento
              </button>
              {/* Botão de entrar em vídeo chamada, se modalidade for online e estiver perto da hora */}
              {consulta.modalidade === "Online" && (
                <button className="EntrarVideochamada">
                  Entrar em Vídeo Chamada
                </button>
              )}
            </>
          );
        case "reagendamento_solicitado": // Profissional propôs, cliente precisa aceitar
          return (
            <p className="status-info">Aguardando cliente aceitar reagendamento.</p>
          );
        case "reagendamento_aceito_cliente":
          return (
            <p className="status-info">Reagendamento aceito pelo cliente.</p>
          );
        case "reagendamento_recusado_cliente":
          return (
            <p className="status-info">Reagendamento recusado pelo cliente.</p>
          );
        default:
          return null; // Não mostra botões para outros status como 'recusada', 'cancelada', 'finalizada'
      }
    }
    // Ações para CLIENTES
    else {
      switch (statusConsulta) {
        case "solicitada":
          return (
            <p className="status-info">Aguardando confirmação do profissional.</p>
          );
        case "confirmada":
          return (
            <>
              {statusPagamento === "pendente" && (
                <button
                  className="PagarConsulta"
                  onClick={() => handleAcao(consulta._id, "pagar")}
                >
                  Pagar Consulta
                </button>
              )}
              <button
                className="ReagendarAgendamento"
                onClick={() => handleAcao(consulta._id, "reagendar")} // Cliente solicita reagendamento ao profissional
              >
                Reagendar Consulta
              </button>
              <button
                className="RecusarAgendamento" // Cliente pode cancelar
                onClick={() => handleAcao(consulta._id, "cancelar")}
              >
                Cancelar Agendamento
              </button>
              {/* Botão de entrar em vídeo chamada, se modalidade for online e estiver perto da hora */}
              {consulta.modalidade === "Online" && statusPagamento === "pago" && (
                <button className="EntrarVideochamada">
                  Entrar em Vídeo Chamada
                </button>
              )}
            </>
          );
        case "reagendamento_solicitado": // Profissional propôs, cliente precisa aceitar/recusar
          return (
            <>
              <p className="status-info">Profissional propôs um reagendamento.</p>
              <button
                className="AceitarAgendamento"
                onClick={() => handleAcao(consulta._id, "reagendar/aceitar")}
              >
                Aceitar Reagendamento
              </button>
              <button
                className="RecusarAgendamento"
                onClick={() => handleAcao(consulta._id, "reagendar/recusar")}
              >
                Recusar Reagendamento
              </button>
            </>
          );
        case "paga":
          return (
            <>
              <p className="status-info">Consulta paga.</p>
              <button
                className="ReagendarAgendamento"
                onClick={() => handleAcao(consulta._id, "reagendar")}
              >
                Reagendar Consulta
              </button>
              <button
                className="RecusarAgendamento" // Cliente pode cancelar
                onClick={() => handleAcao(consulta._id, "cancelar")}
              >
                Cancelar Agendamento
              </button>
              {/* Botão de entrar em vídeo chamada, se modalidade for online e estiver perto da hora */}
              {consulta.modalidade === "Online" && (
                <button className="EntrarVideochamada">
                  Entrar em Vídeo Chamada
                </button>
              )}
            </>
          );
        default:
          return null; // Não mostra botões para outros status como 'recusada', 'cancelada', 'finalizada'
      }
    }
  };

  const renderSolicitacaoOuConsulta = (consulta: Consulta, ehSolicitacao: boolean) => {
    const outroUsuario = getUsuarioOutroLado(consulta);
    const foto = getFoto(outroUsuario);
    const nomeCompleto = outroUsuario
      ? `${outroUsuario.nome}`
      : "Usuário";
    const dataHoraFormatada = formatarDataHora(consulta.data, consulta.horario);

    return (
      <div
        key={consulta._id}
        className={ehSolicitacao ? "Solicitacoes" : "Consulta"}
      >
        <h1>
          {ehSolicitacao ? "Solicitação" : "Consulta"}: {dataHoraFormatada}
        </h1>
        <hr />
        <div className="InfoUsuarioSolicitacao">
          <div className="FotoPerfil">
            <img src={foto} alt="Foto de perfil" />
          </div>
          <div className="containerSolic">
            <div className="infoUser">
              <h2>{nomeCompleto}</h2>
              <a href={`/perfil/${outroUsuario?._id}`} className="VerPerfilCompleto">
                Ver perfil completo
              </a>
              <h2>Agendamento:</h2>
              <p>
                Modalidade de agendamento: {consulta.modalidade} <br />
                Valor: R$ {consulta.valor.toFixed(2)} — Duração:{" "}
                {consulta.duracao} min
              </p>
              <p>Status da consulta: {consulta.statusConsulta}</p>
              {consulta.statusPagamento && (
                <p>Status do pagamento: {consulta.statusPagamento}</p>
              )}
            </div>
          </div>
          <div className="opcoes">
            {renderBotoesAcao(consulta)} {/* Renderiza os botões dinamicamente */}
          </div>
        </div>
      </div>
    );
  };

  if (!token) {
    return (
      <div className="TeladAgendamentos">
        <p className="erro-message">Faça login para ver seus agendamentos.</p>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="TeladAgendamentos">
        <p className="loading-message">Carregando agendamentos...</p>
      </div>
    );
  }

  return (
    <div className="TeladAgendamentos">
      {erro && <p className="erro-message">{erro}</p>}

      {/* Solicitações de Agendamento */}
      <div className="solicitacoesAgendamento">
        <div className="tituloSolicitacoesAgendamento">
          <h1>Solicitações de Agendamentos:</h1>
        </div>

        {solicitacoes.length === 0 ? (
          <p className="nenhum-agendamento">
            Nenhuma solicitação de agendamento pendente.
          </p>
        ) : (
          solicitacoes.map((consulta) =>
            renderSolicitacaoOuConsulta(consulta, true)
          )
        )}
      </div>

      {/* Consultas Confirmadas / Outras */}
      <div className="consultasAgendamento">
        <div className="tituloConsultasAgendamento">
          <h1>Consultas Confirmadas:</h1>
        </div>

        {consultasConfirmadas.length === 0 ? (
          <p className="nenhum-agendamento">
            Nenhuma consulta confirmada no momento.
          </p>
        ) : (
          consultasConfirmadas.map((consulta) =>
            renderSolicitacaoOuConsulta(consulta, false)
          )
        )}
      </div>
    </div>
  );
};

export default Agendamentos;
