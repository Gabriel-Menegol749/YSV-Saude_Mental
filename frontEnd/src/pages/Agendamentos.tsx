import { useEffect, useState, useCallback } from "react";
import { format, parseISO} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../contextos/ContextoAutenticacao";
import { useNavigate } from "react-router-dom";
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

interface UsuarioPopulado {
    _id: string;
    nome: string;
    fotoPerfil?: string;
    infoProfissional?: {
        profissao?: string;
        crp?: string;
        valorConsulta?: number;
        duracaoConsulta?: number;
    };
}

interface Consulta {
    _id: string;
    clienteId: UsuarioPopulado;
    profissionalId: UsuarioPopulado;
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
    | "reagendamento_aceito_profissional"
    | "reagendamento_recusado_profissional"
    | "paga"
    | "finalizada";
    historicoAcoes: {
        acao: string;
        porUsuario: string;
        dataAcao: Date;
    }[];
     dataFormatada?: string;
    horaFormatada?: string;
    dataPropostaReagendamento?: string;
    horarioPropostoReagendamento?: string;
    feedBack?: string;
}

const Agendamentos = () => {
    const { token, usuario } = useAuth();
    const navigate = useNavigate();
    const [solicitacoes, setSolicitacoes] = useState<Consulta[]>([]);
    const [consultasConfirmadas, setConsultasConfirmadas] = useState<Consulta[]>([]);
    const [, setConsultasFinalizadas] = useState<Consulta[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const ehProfissional = usuario?.tipoUsuario === "Profissional";

    const formatarDataHora = (dataStr: string, horarioStr: string) => {
        const data = parseISO(dataStr);
        return `${format(data, "dd/MM/yyyy", { locale: ptBR })} às ${horarioStr}`;
    };

    const fetchAgendamentos = useCallback(async () => {
        if (!token || !usuario?._id) {
            setCarregando(false);
            return;
        }
        setCarregando(true);
        setErro(null);
        try {
            let url = '';
            if (usuario.tipoUsuario === 'Cliente') {
                url = '/agendamentos/cliente';
            } else if (usuario.tipoUsuario === 'Profissional') {
                url = '/agendamentos/profissional';
            } else {
                setErro("Tipo de usuário desconhecido.");
                setCarregando(false);
                return;
            }
            console.log(`DEBUG Frontend - Buscando agendamentos para ${usuario.tipoUsuario} na URL: ${url}`);
            const response = await api.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log('DEBUG Frontend - Resposta da API de agendamentos:', response.data);
            const agendamentos = response.data;
            // Filtrar e categorizar os agendamentos
            const solicitacoesPendentes = agendamentos.filter(
                (c: Consulta) => c.statusConsulta === "solicitada" || c.statusConsulta === "reagendamento_solicitado"
            );
            const confirmadas = agendamentos.filter(
                (c: Consulta) => c.statusConsulta === "confirmada" || c.statusConsulta === "paga" || c.statusConsulta === "reagendamento_aceito_cliente" || c.statusConsulta === "reagendamento_aceito_profissional"
            );
            const finalizadas = agendamentos.filter(
                (c: Consulta) => c.statusConsulta === "finalizada"
            );
            setSolicitacoes(solicitacoesPendentes);
            setConsultasConfirmadas(confirmadas);
            setConsultasFinalizadas(finalizadas);
        } catch (error: any) {
            console.error("Erro ao buscar agendamentos:", error);
            if (error.response) {
                setErro(`Erro ao carregar agendamentos: ${error.response.data.mensagem || error.message}`);
            } else {
                setErro(`Erro ao carregar agendamentos: ${error.message}`);
            }
        } finally {
            setCarregando(false);
        }
    }, [token, usuario]);

    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos]);

    const getUsuarioOutroLado = (consulta: Consulta): UsuarioPopulado | null => {
        if (ehProfissional) {
            const outro = typeof consulta.clienteId === "string"
                ? null
                : (consulta.clienteId as UsuarioPopulado);
            return outro;
        } else {
            const outro = typeof consulta.profissionalId === "string"
                ? null
                : (consulta.profissionalId as UsuarioPopulado);
            return outro;
        }
    };

    const getFoto = (user: UsuarioPopulado | null) => {
        if (user?.fotoPerfil) {
            const fotoPath = user.fotoPerfil;
            if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://')) {
                return fotoPath;
            }
            if (fotoPath.startsWith('/')) {
                const baseUrl = getMediaBaseUrl();
                return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${fotoPath}`;
            }
            return `${getMediaBaseUrl()}/${fotoPath}`;
        }
        return fotoPefilPadrao;
    };

    const handleAcao = async (
        consultaId: string,
        novaAcao:
            | "aceitar"
            | "recusar"
            | "reagendar"
            | "cancelar"
            | "pagar"
            | "reagendar/aceitar"
            | "reagendar/recusar"
            | "profissional/aceita-reagendamento"
            | "profissional/recusa-reagendamento"
            | "finalizar"
            | "feedback"
    ) => {
        if (!token) {
            alert("Você precisa estar logado para realizar esta ação.");
            return;
        }
        setCarregando(true);
        setErro(null);
        let url = "";
        let method: "PUT" | "POST" = "PUT";
        let body: any = undefined;

        try {
            switch (novaAcao) {
                case "aceitar":
                    url = `/agendamentos/${consultaId}/confirmar`;
                    method = "PUT";
                    break;
                case "recusar":
                    url = `/agendamentos/${consultaId}/cancelar`;
                    method = "PUT";
                    break;
                case "cancelar":
                    url = `/agendamentos/${consultaId}/cancelar`;
                    method = "PUT";
                    break;
                case "reagendar":
                    const novaData = window.prompt(
                        "Informe a nova data para o agendamento (formato YYYY-MM-DD):",
                        format(new Date(), 'yyyy-MM-dd')
                    );
                    const novoHorario = window.prompt(
                        "Informe o novo horário (formato HH:mm):",
                        format(new Date(), 'HH:mm')
                    );

                    if (!novaData || !novoHorario) {
                        alert("Reagendamento cancelado: nova data e horário são obrigatórios.");
                        setCarregando(false);
                        return;
                    }

                    const ehProfissional = usuario?.tipoUsuario === "Profissional";
                    if (ehProfissional) {
                        url = `/agendamentos/${consultaId}/solicitar-reagendamento`;
                    } else {
                        url = `/agendamentos/${consultaId}/solicitar-reagendamento-cliente`;
                    }

                    method = "PUT";
                    body = { novaData, novoHorario };
                    break;
                case "pagar":
                    url = `/agendamentos/${consultaId}/pagar`;
                    method = "PUT";
                    break;
                case "reagendar/aceitar": // Cliente aceita proposta do profissional
                    url = `/agendamentos/${consultaId}/cliente-aceita-reagendamento`;
                    method = "PUT";
                    break;
                case "reagendar/recusar": // Cliente recusa proposta do profissional
                    url = `/agendamentos/${consultaId}/cliente-recusa-reagendamento`;
                    method = "PUT";
                    break;
                case "profissional/aceita-reagendamento": // Profissional aceita proposta do cliente
                    url = `/agendamentos/${consultaId}/profissional-aceita-reagendamento`;
                    method = "PUT";
                    break;
                case "profissional/recusa-reagendamento": // Profissional recusa proposta do cliente
                    url = `/agendamentos/${consultaId}/profissional-recusa-reagendamento`;
                    method = "PUT";
                    break;
                case "finalizar":
                    url = `/agendamentos/${consultaId}/finalizar`;
                    method = "PUT";
                    break;
                case "feedback":
                    const nota = window.prompt("Informe a nota (1-5):");
                    const comentario = window.prompt("Deixe um comentário (opcional):");
                    if (!nota || isNaN(Number(nota)) || Number(nota) < 1 || Number(nota) > 5) {
                        alert("Feedback cancelado: A nota deve ser um número entre 1 e 5.");
                        setCarregando(false);
                        return;
                    }
                    body = { nota: Number(nota), comentario };
                    url = `/agendamentos/${consultaId}/feedback`;
                    method = "PUT";
                    break;
                default:
                    alert("Ação desconhecida.");
                    setCarregando(false);
                    return;
            }

            if (!url) {
                alert("Erro: URL da ação não definida.");
                setCarregando(false);
                return;
            }

            console.log(`DEBUG Frontend - Enviando ${method} para ${url} com body:`, body);

            const response = await api({
                method,
                url,
                data: body,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = response.data;
            if (response.status >= 200 && response.status < 300) {
                alert(data.mensagem || "Ação realizada com sucesso.");
                fetchAgendamentos();
            } else {
                setErro(data.mensagem || `Erro: ${response.status}`);
                alert(data.mensagem || `Erro: ${response.status}`);
            }
        } catch (e: any) {
            console.error("Erro ao executar ação no agendamento:", e);
            const errorMessage = e.response?.data?.mensagem || e.message || "Erro ao executar ação.";
            setErro(errorMessage);
            alert(errorMessage);
        } finally {
            setCarregando(false);
        }
    };

    const handleEntrarVideochamada = (consultaId: string) => {
        navigate(`/videochamada/${consultaId}`);
    };

    const renderBotoesAcao = (consulta: Consulta) => {
        const { statusConsulta } = consulta;

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
                                className="CancelarAgendamento"
                                onClick={() => handleAcao(consulta._id, "cancelar")}
                            >
                                Cancelar Agendamento
                            </button>
                            {consulta.modalidade === "Online" && (
                                <button
                                    className="EntrarVideochamada"
                                    onClick={() => handleEntrarVideochamada(consulta._id)}
                                >
                                    Entrar em Vídeo Chamada
                                </button>
                            )}
                            {consulta.statusConsulta === "paga" && (
                                <button
                                    className="FinalizarAgendamento"
                                    onClick={() => handleAcao(consulta._id, "finalizar")}
                                >
                                    Finalizar Consulta
                                </button>
                            )}
                        </>
                    );
                case "reagendamento_solicitado": // ✅ QUANDO O CLIENTE PROPOS REAGENDAMENTO
                    return (
                        <>
                            <p className="status-info">
                                Cliente propôs reagendamento para: {formatarDataHora(consulta.dataPropostaReagendamento || '', consulta.horarioPropostoReagendamento || '')}
                            </p>
                            <button
                                className="AceitarAgendamento"
                                onClick={() => handleAcao(consulta._id, "profissional/aceita-reagendamento")}
                            >
                                Aceitar Reagendamento
                            </button>
                            <button
                                className="RecusarAgendamento"
                                onClick={() => handleAcao(consulta._id, "profissional/recusa-reagendamento")}
                            >
                                Recusar Reagendamento
                            </button>
                        </>
                    );
                case "reagendamento_aceito_cliente":
                    return (
                        <p className="status-info">Reagendamento aceito pelo cliente.</p>
                    );
                case "reagendamento_recusado_cliente":
                    return (
                        <p className="status-info">Reagendamento recusado pelo cliente.</p>
                    );
                case "reagendamento_aceito_profissional":
                    return (
                        <p className="status-info">Você aceitou o reagendamento.</p>
                    );
                case "reagendamento_recusado_profissional":
                    return (
                        <p className="status-info">Você recusou o reagendamento.</p>
                    );
                case "finalizada":
                    return (
                        <p className="status-info">Consulta finalizada.</p>
                    );
                default:
                    return null;
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
                            {ehProfissional && (
                                <button
                                    className="FinalizarConsulta"
                                    onClick={() => handleAcao(consulta._id, "finalizar")}
                                >
                                    Finalizar Consulta
                                </button>
                            )}
                            {!ehProfissional && consulta.statusPagamento !== "paga" && (
                                <button
                                    className="PagarConsulta"
                                    onClick={() => handleAcao(consulta._id, "pagar")}
                                >
                                    Pagar Consulta
                                </button>
                            )}
                            {consulta.modalidade === "Online" && (
                                <button
                                    className="EntrarVideochamada"
                                    onClick={() => navigate(`/videochamada/${consulta._id}`)}
                                >
                                    Entrar em Vídeo Chamada
                                </button>
                            )}
                            <button
                                className="ReagendarConsulta"
                                onClick={() => handleAcao(consulta._id, "reagendar")}
                            >
                                Reagendar
                            </button>
                            <button
                                className="CancelarConsulta"
                                onClick={() => handleAcao(consulta._id, "cancelar")}
                            >
                                Cancelar
                            </button>
                        </>
                    );
                case "reagendamento_solicitado": // ✅ QUANDO O PROFISSIONAL PROPOS REAGENDAMENTO
                    return (
                        <>
                            <p className="status-info">
                                Profissional propôs reagendamento para: {formatarDataHora(consulta.dataPropostaReagendamento || '', consulta.horarioPropostoReagendamento || '')}
                            </p>
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
                case "reagendamento_aceito_profissional":
                    return (
                        <p className="status-info">Profissional aceitou o reagendamento.</p>
                    );
                case "reagendamento_recusado_profissional":
                    return (
                        <p className="status-info">Profissional recusou o reagendamento.</p>
                    );
                case "finalizada":
                    return (
                        <>
                            <p className="status-info">Consulta finalizada.</p>
                            {!consulta.feedBack && (
                                <button
                                    className="EnviarFeedback"
                                    onClick={() => handleAcao(consulta._id, "feedback")}
                                >
                                    Enviar Feedback
                                </button>
                            )}
                        </>
                    );
                default:
                    return null;
            }
        }
    };

    const renderSolicitacaoOuConsulta = (consulta: Consulta, ehSolicitacao: boolean) => {
        const outroUsuario = getUsuarioOutroLado(consulta);
        const fotoDoOutroUsuario = getFoto(outroUsuario);
        const nomeCompleto = outroUsuario
            ? `${outroUsuario.nome}`
            : "Usuário";
        const dataHoraFormatada = formatarDataHora(consulta.data, consulta.horario);

        const propostaReagendamentoInfo = consulta.statusConsulta === "reagendamento_solicitado" && consulta.dataPropostaReagendamento && consulta.horarioPropostoReagendamento
            ? ` (Proposta: ${formatarDataHora(consulta.dataPropostaReagendamento, consulta.horarioPropostoReagendamento)})`
            : '';

        return (
            <div
                key={consulta._id}
                className={ehSolicitacao ? "Solicitacoes" : "Consulta"}
            >
                <h1>
                    {ehSolicitacao ? "Solicitação" : "Consulta"}: {dataHoraFormatada}
                    {propostaReagendamentoInfo} {/* ✅ Adiciona a info da proposta */}
                </h1>
                <hr />
                <div className="InfoUsuarioSolicitacao">
                    <div className="FotoPerfil">
                        <img
                            className='fotoPerfilCabecalho'
                            src={fotoDoOutroUsuario}
                            alt="Foto de Perfil"
                            onError={(e) => {
                                e.currentTarget.src = fotoPefilPadrao; // Define a imagem padrão como fallback
                            }}
                        />
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
                                Valor: R¨D {consulta.valor.toFixed(2)} — Duração:{" "}
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