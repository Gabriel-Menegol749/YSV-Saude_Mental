// src/pages/Conversas.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from "../contextos/ContextoAutenticacao";
import { useNotificacoes } from "../contextos/ContextoNotificacoes";
import api from '../services/api';
// Importe seus ícones
import enviarIcon from "../assets/telaConversasIcons/enviar.png";
import videoligacaoIcon from "../assets/telaConversasIcons/videoLigacao.png";
import ligacaoIcon from "../assets/telaConversasIcons/ligacao.png";
import infoIcon from "../assets/telaConversasIcons/info.png"; // Usado para o ícone de pesquisa também
import fotoPerfilContatoPadrao from '../assets/profile-circle-svgrepo-com.svg';
import logoYSV from "../assets/logoNomYSV.png"; // Importar o logo YSV
import tresPontosIcon from "../assets/3pontsConfig.png"; // Ícone de três pontos
import './Conversas.css';

// --- Interfaces ---
interface UsuarioAuth {
    _id: string;
    nome: string;
    fotoPerfil?: string;
}

interface UsuarioChat {
    _id: string;
    nome: string;
    fotoPerfil?: string;
}

interface Mensagem {
    _id: string;
    conversaId: string;
    remetente: UsuarioChat; // Remetente aqui é o objeto completo do usuário
    conteudo: string;
    timestamp: string; // Formato ISO para mensagens individuais
}

interface ConversaFrontend {
    _id: string;
    participanteId: string; // ID do outro participante na conversa
    nomeParticipante: string;
    fotoParticipante?: string;
    ultimaMensagem?: {
        conteudo: string;
        timestamp: string; // Já vem formatado como dd-MM-yyyy do backend
        remetente: string; // ID do remetente da última mensagem
        remetenteNome?: string; // Nome do remetente da última mensagem
        remetenteFoto?: string; // Foto do remetente da última mensagem
    };
    timestampUltimaMensagem?: string; // Já vem formatado como dd-MM-yyyy do backend
    naoLidasContador: number;
}

// --- Função Auxiliar para URL de Foto de Perfil ---
const normalizarFotoPerfilUrl = (url?: string) => {
    if (!url) return undefined;
    const baseUrl = api.defaults.baseURL?.replace('/api', '') || '';
    if (url.startsWith('http')) {
        return url;
    }
    return `${baseUrl}${url}`;
};

// --- NOVA Função Auxiliar para parsear data dd-MM-yyyy ---
const parseDDMMYYYY = (dateString: string | undefined | null): Date => {
    if (!dateString) return new Date(0); // Retorna uma data inválida ou padrão
    const [day, month, year] = dateString.split('-').map(Number);
    // Mês é 0-indexado no JavaScript Date
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? new Date(0) : date; // Retorna new Date(0) se for inválida
};

// --- Componente Conversas ---
export default function Conversas() {
    const { usuario, token } = useAuth();
    const { socket } = useNotificacoes();
    const { destinatarioId: destinatarioIdParam } = useParams<{ destinatarioId?: string }>();
    const navigate = useNavigate();

    const [conversas, setConversas] = useState<ConversaFrontend[]>([]);
    const [chatAtivo, setChatAtivo] = useState<ConversaFrontend | null>(null);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [novaMensagemConteudo, setNovaMensagemConteudo] = useState("");
    const [carregandoConversas, setCarregandoConversas] = useState(true);
    const [carregandoMensagens, setCarregandoMensagens] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [termoPesquisa, setTermoPesquisa] = useState("");

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const isMounted = useRef(true); // Para controlar se o componente está montado
    const hasProcessedDestinatarioId = useRef(false); // Para evitar reprocessar o destinatarioId da URL

    // Função para rolar para o final do chat
    const scrollToBottom = useCallback(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, []);

    // --- Funções de API (memoizadas com useCallback) ---
    const fetchConversas = useCallback(async () => {
        if (!isMounted.current || !usuario?._id || !token) {
            setCarregandoConversas(false);
            return;
        }
        console.log("Conversas.tsx: Chamando API para /chat/conversas");
        setCarregandoConversas(true);
        setErro(null);
        try {
            const response = await api.get('/chat/conversas', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Conversas.tsx: Resposta de /api/chat/conversas:", response.data);

            const conversasFormatadas: ConversaFrontend[] = response.data.map((conversa: any) => {
                const participantesArray = Array.isArray(conversa.participantes) ? conversa.participantes : [];
                const outroParticipante = participantesArray.find(
                    (p: any) => p && p._id && p._id.toString() !== usuario._id.toString()
                );

                // O backend agora envia naoLidasContador como um número simples para o usuário logado
                const naoLidas = conversa.naoLidasContador || 0;

                return {
                    _id: conversa._id,
                    participanteId: outroParticipante?._id.toString() || '',
                    nomeParticipante: outroParticipante?.nome || 'Usuário Desconhecido',
                    fotoParticipante: normalizarFotoPerfilUrl(outroParticipante?.fotoPerfil),
                    ultimaMensagem: conversa.ultimaMensagem ? {
                        conteudo: conversa.ultimaMensagem.conteudo,
                        timestamp: conversa.ultimaMensagem.timestamp, // Já vem dd-MM-yyyy
                        remetente: conversa.ultimaMensagem.remetente, // ID do remetente
                        remetenteNome: conversa.ultimaMensagem.remetenteNome, // Nome do remetente
                        remetenteFoto: conversa.ultimaMensagem.remetenteFoto, // Foto do remetente
                    } : undefined,
                    timestampUltimaMensagem: conversa.timestampUltimaMensagem, // Já vem dd-MM-yyyy
                    naoLidasContador: naoLidas,
                };
            }).filter(Boolean); // Remove quaisquer entradas nulas/undefined se houver

            if (isMounted.current) {
                setConversas(conversasFormatadas);
            }
        } catch (err: any) {
            console.error("Conversas.tsx: Erro ao buscar conversas:", err);
            if (isMounted.current) {
                setErro(err.response?.data?.mensagem || "Erro ao carregar conversas.");
            }
        } finally {
            if (isMounted.current) {
                setCarregandoConversas(false);
            }
        }
    }, [usuario?._id, token]);

    const iniciarOuObterConversa = useCallback(async (destinatarioId: string) => {
        if (!isMounted.current || !usuario?._id || !token) {
            setErro("Usuário não autenticado.");
            return;
        }
        setCarregandoMensagens(true);
        setErro(null);
        try {
            console.log(`Conversas.tsx: Chamando API para /chat/iniciar com destinatário: ${destinatarioId}`);
            const response = await api.post('/chat/iniciar', { destinatarioId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Conversas.tsx: Resposta de /api/chat/iniciar:", response.data);
            const conversaBackend = response.data;

            const outroParticipante = conversaBackend.participantes.find(
                (p: any) => p._id && p._id.toString() !== usuario._id.toString()
            );

            // O backend agora envia naoLidasContador como um número simples para o usuário logado
            const naoLidas = conversaBackend.naoLidasContador || 0;

            const conversaFormatada: ConversaFrontend = {
                _id: conversaBackend._id,
                participanteId: outroParticipante?._id.toString() || '',
                nomeParticipante: outroParticipante?.nome || 'Usuário Desconhecido',
                fotoParticipante: normalizarFotoPerfilUrl(outroParticipante?.fotoPerfil),
                ultimaMensagem: conversaBackend.ultimaMensagem ? {
                    conteudo: conversaBackend.ultimaMensagem.conteudo,
                    timestamp: conversaBackend.ultimaMensagem.timestamp, // Já vem dd-MM-yyyy
                    remetente: conversaBackend.ultimaMensagem.remetente, // ID do remetente
                    remetenteNome: conversaBackend.ultimaMensagem.remetenteNome, // Nome do remetente
                    remetenteFoto: conversaBackend.ultimaMensagem.remetenteFoto, // Foto do remetente
                } : undefined,
                timestampUltimaMensagem: conversaBackend.timestampUltimaMensagem, // Já vem dd-MM-yyyy
                naoLidasContador: naoLidas,
            };

            if (isMounted.current) {
                setChatAtivo(conversaFormatada);
            }
        } catch (err: any) {
            console.error("Conversas.tsx: Erro ao iniciar ou obter conversa:", err);
            if (isMounted.current) {
                setErro(err.response?.data?.mensagem || "Erro ao iniciar ou obter conversa.");
            }
        } finally {
            if (isMounted.current) {
                setCarregandoMensagens(false);
            }
        }
    }, [usuario?._id, token]);

    const fetchMensagens = useCallback(async (conversaId: string) => {
        if (!isMounted.current || !token) return;
        setCarregandoMensagens(true);
        setErro(null);
        try {
            console.log(`Conversas.tsx: Chamando API para /chat/mensagens/${conversaId}`);
            const response = await api.get(`/chat/mensagens/${conversaId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`Conversas.tsx: Resposta de /api/chat/mensagens/${conversaId}:`, response.data);
            if (isMounted.current) {
                // As mensagens individuais ainda devem ter timestamp ISO para formatar a hora
                setMensagens(response.data);
            }
            await marcarMensagensComoLidasNoBackend(conversaId);
        } catch (err: any) {
            console.error("Conversas.tsx: Erro ao buscar mensagens:", err);
            if (isMounted.current) {
                setErro(err.response?.data?.mensagem || "Erro ao buscar mensagens.");
            }
        } finally {
            if (isMounted.current) {
                setCarregandoMensagens(false);
                scrollToBottom();
            }
        }
    }, [token, scrollToBottom]);

    const marcarMensagensComoLidasNoBackend = useCallback(async (conversaId: string) => {
        if (!isMounted.current || !token) return;
        try {
            console.log(`Conversas.tsx: Marcando mensagens como lidas para conversa: ${conversaId}`);
            await api.put(`/chat/mensagens/${conversaId}/lida`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (isMounted.current) {
                setConversas(prevConversas =>
                    prevConversas.map(c =>
                        c._id === conversaId ? { ...c, naoLidasContador: 0 } : c
                    )
                );
            }
        } catch (err) {
            console.error("Conversas.tsx: Erro ao marcar mensagens como lidas:", err);
        }
    }, [token]);

    const handleEnviarMensagem = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagemConteudo.trim() || !chatAtivo?._id || !usuario?._id || !token) return;

    try {
        const mensagemParaEnviar = {
            conversaId: chatAtivo._id,
            remetenteId: usuario._id, // <-- This is `remetenteId`
            conteudo: novaMensagemConteudo,
        };
        // Envia a mensagem via API
        const response = await api.post('/chat/mensagens', mensagemParaEnviar, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // ... rest of the logic
    } catch (err) {
        console.error("Conversas.tsx: Erro ao enviar mensagem:", err);
        setErro("Erro ao enviar mensagem.");
        // ... rest of the error handling
    }
}, [novaMensagemConteudo, chatAtivo, usuario, token, socket, scrollToBottom]); 

    // Efeito para buscar conversas iniciais
    useEffect(() => {
        console.log("Conversas.tsx: useEffect para buscar conversas iniciais.");
        isMounted.current = true;
        if (usuario && token) {
            fetchConversas();
        }
        return () => {
            isMounted.current = false;
        };
    }, [usuario, token, fetchConversas]);

    // Efeito para lidar com o destinatarioId da URL
    useEffect(() => {
        if (destinatarioIdParam && usuario && token && !hasProcessedDestinatarioId.current) {
            console.log(`Conversas.tsx: Destinatário ID na URL: ${destinatarioIdParam}`);
            hasProcessedDestinatarioId.current = true; // Marca como processado

            // Tenta encontrar a conversa existente
            const conversaExistente = conversas.find(
                (c) => c.participanteId === destinatarioIdParam
            );

            if (conversaExistente) {
                console.log(`Conversas.tsx: Conversa existente encontrada para ${destinatarioIdParam}.`);
                setChatAtivo(conversaExistente);
            } else {
                console.log(`Conversas.tsx: Nenhuma conversa existente para ${destinatarioIdParam}, iniciando nova.`);
                iniciarOuObterConversa(destinatarioIdParam);
            }
            // Redireciona para /conversas para limpar o ID da URL após processar
            navigate('/conversas', { replace: true });
        } else if (!destinatarioIdParam && hasProcessedDestinatarioId.current) {
            console.log("Conversas.tsx: Destinatário ID removido da URL, limpando chat ativo.");
            setChatAtivo(null);
            setMensagens([]);
            hasProcessedDestinatarioId.current = false;
        }
    }, [destinatarioIdParam, usuario?._id, token, conversas, iniciarOuObterConversa, navigate]); // Removi chatAtivo das dependências para evitar loop

    // Efeito para carregar mensagens do chat ativo
    useEffect(() => {
        if (chatAtivo && usuario && token) {
            console.log(`Conversas.tsx: Chat ativo mudou para ${chatAtivo._id}, buscando mensagens.`);
            fetchMensagens(chatAtivo._id);
        } else {
            setMensagens([]);
        }
    }, [chatAtivo, usuario, token, fetchMensagens]);

useEffect(() => {
    if (!socket || !usuario?._id) {
        console.log("Conversas.tsx: Socket ou usuário ausente, não configurando listeners.");
        return;
    }
    console.log("Conversas.tsx: Ouvindo eventos do socket global.");

    // Use useCallback para estas funções para que elas não mudem a cada render
    // e não causem re-execução desnecessária do useEffect de socket
    const handleReceberMensagem = (mensagem: Mensagem) => {
        console.log("Conversas.tsx: Mensagem recebida via socket:", mensagem);
        if (!isMounted.current) return;
        if (chatAtivo?._id === mensagem.conversaId) {
            // Use a forma funcional de setMensagens para não depender de 'mensagens' no useEffect
            setMensagens(prevMensagens => [...prevMensagens, mensagem]);
            scrollToBottom();
            marcarMensagensComoLidasNoBackend(mensagem.conversaId);
        }
        fetchConversas(); // Atualiza a lista de conversas para refletir a última mensagem/contador
    };

    const handleMensagemEnviadaConfirmada = (mensagem: Mensagem) => {
        console.log("Conversas.tsx: Mensagem enviada confirmada via socket:", mensagem);
        if (!isMounted.current) return;
        if (chatAtivo?._id === mensagem.conversaId) {
            // Verifique se a mensagem já existe para evitar duplicatas (se você usa mensagens temporárias)
            setMensagens(prevMensagens => {
                if (!prevMensagens.some(m => m._id === mensagem._id)) {
                    return [...prevMensagens, mensagem];
                }
                return prevMensagens;
            });
            scrollToBottom();
        }
        fetchConversas(); // Atualiza a lista de conversas
    };

    const handleMensagensLidas = ({ conversaId, lidoPor }: { conversaId: string; lidoPor: string }) => {
        console.log(`Conversas.tsx: Mensagens da conversa ${conversaId} lidas por ${lidoPor} via socket.`);
        if (!isMounted.current) return;
        if (lidoPor === usuario._id || chatAtivo?._id === conversaId) {
            fetchConversas(); // Atualiza a lista para zerar o contador
        }
    };

    socket.on('receberMensagem', handleReceberMensagem);
    socket.on('mensagemEnviadaConfirmada', handleMensagemEnviadaConfirmada);
    socket.on('mensagensLidas', handleMensagensLidas);

    return () => {
        console.log("Conversas.tsx: Removendo listeners de socket.");
        socket.off('receberMensagem', handleReceberMensagem);
        socket.off('mensagemEnviadaConfirmada', handleMensagemEnviadaConfirmada);
        socket.off('mensagensLidas', handleMensagensLidas);
    };
}, [socket, usuario?._id, chatAtivo?._id, fetchConversas, marcarMensagensComoLidasNoBackend, scrollToBottom]); // CORREÇÃO: REMOVIDO 'mensagens' daqui.


    // --- Handlers de UI ---
    const handleSelecionarConversa = useCallback(async (conversa: ConversaFrontend) => {
        console.log(`Conversas.tsx: Selecionando conversa: ${conversa._id}`);
        if (chatAtivo?._id === conversa._id) {
            console.log("Conversas.tsx: Conversa já ativa, ignorando seleção.");
            return;
        }
        setChatAtivo(conversa);
    }, [chatAtivo]);

    // Filtra as conversas com base no termo de pesquisa
    const conversasFiltradas = conversas.filter(conversa =>
        conversa.nomeParticipante.toLowerCase().includes(termoPesquisa.toLowerCase())
    );

    // Se o usuário não estiver logado, redireciona ou mostra mensagem
    if (!usuario) {
        return <p>Por favor, faça login para acessar suas conversas.</p>;
    }

    // --- Renderização ---
    const renderListaConversas = () => (
        <div className="lista-conversas">
            <div className="cabecalho-lista-conversas">
                <div className="logo-e-titulo">
                    <img src={logoYSV} alt="Logo YSV" className="logo-ysv-chat" />
                    <h2>Saúde Mental</h2>
                </div>
                <img src={tresPontosIcon} alt="Opções" className="icone-opcoes" />
            </div>
            <div className="pesquisa-conversas">
                <img src={infoIcon} alt="Pesquisar" className="icone-pesquisa" />
                <input
                    type="text"
                    placeholder="Pesquisa conversas:"
                    value={termoPesquisa}
                    onChange={(e) => setTermoPesquisa(e.target.value)}
                    className="input-pesquisa-chat"
                />
            </div>
            <div className="filtros-chat">
                <span className="filtro-nao-lidas">Não lidas</span>
            </div>
            {carregandoConversas ? (
                <p className="mensagem-carregando">Carregando conversas...</p>
            ) : erro ? (
                <p className="erro-mensagem">Erro: {erro}</p>
            ) : conversasFiltradas.length === 0 ? (
                <p className="nenhuma-conversa">Nenhuma conversa encontrada.</p>
            ) : (
                <div className="container-itens-conversas">
                    {conversasFiltradas
                        .sort((a, b) => {
                            // Usar a nova função parseDDMMYYYY para ordenar corretamente
                            const dateA = parseDDMMYYYY(a.timestampUltimaMensagem);
                            const dateB = parseDDMMYYYY(b.timestampUltimaMensagem);
                            return dateB.getTime() - dateA.getTime();
                        })
                        .map((conversa) => (
                            <div
                                key={conversa._id}
                                className={`item-conversa ${chatAtivo?._id === conversa._id ? 'ativo' : ''}`}
                                onClick={() => handleSelecionarConversa(conversa)}
                            >
                                <img
                                    src={conversa.fotoParticipante || fotoPerfilContatoPadrao}
                                    alt={conversa.nomeParticipante}
                                    className="foto-perfil-conversa"
                                />
                                <div className="info-conversa">
                                    <span className="nome-contato">{conversa.nomeParticipante}</span>
                                    <p className="ultima-mensagem">
                                        {conversa.ultimaMensagem?.conteudo || "Nenhuma mensagem."}
                                    </p>
                                </div>
                                <div className="status-conversa">
                                    {conversa.timestampUltimaMensagem && (
                                        <span className="hora-ultima-mensagem">
                                            {/* A data já vem formatada do backend, só precisamos extrair a hora se necessário */}
                                            {/* Se o backend envia 'dd-MM-yyyy', não tem informação de hora.
                                                Se você quiser a hora, o backend precisa enviar um timestamp completo (ISO)
                                                para a ultimaMensagem.timestamp, e o timestampUltimaMensagem pode ser a data formatada.
                                                Por enquanto, vou exibir a data formatada. Se precisar da hora, me avise para ajustar o backend.
                                            */}
                                            {conversa.timestampUltimaMensagem}
                                        </span>
                                    )}
                                    {conversa.naoLidasContador > 0 && (
                                        <span className="contador-nao-lidas">{conversa.naoLidasContador}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );

    const renderChatAtivo = () => (
        <div className="chat-ativo">
            {chatAtivo ? (
                <>
                    <div className="cabecalho-chat">
                        <img
                            src={chatAtivo.fotoParticipante || fotoPerfilContatoPadrao}
                            alt={chatAtivo.nomeParticipante}
                            className="foto-perfil-chat"
                        />
                        <div className="info-cabecalho-chat">
                            <span className="nome-contato">{chatAtivo.nomeParticipante}</span>
                            <span className="status-online">Online</span>
                        </div>
                        <div className="icones-cabecalho-chat">
                            <img src={videoligacaoIcon} alt="Video Chamada" className="icone-chat" />
                            <img src={ligacaoIcon} alt="Chamada" className="icone-chat" />
                            <img src={tresPontosIcon} alt="Informações" className="icone-chat" />
                        </div>
                    </div>
                    <div className="mensagens-container" ref={chatContainerRef}>
                        {carregandoMensagens ? (
                            <p className="mensagem-carregando">Carregando mensagens...</p>
                        ) : erro ? (
                            <p className="erro-mensagem">Erro: {erro}</p>
                        ) : mensagens.length === 0 ? (
                            <p className="nenhuma-mensagem">Comece uma conversa!</p>
                        ) : (
                            mensagens.map((mensagem) => (
                                <div
                                    key={mensagem._id}
                                    className={`mensagem ${mensagem.remetente._id === usuario._id ? 'minha-mensagem' : 'outra-mensagem'}`}
                                >
                                    <div className="conteudo-mensagem">
                                        <p>{mensagem.conteudo}</p>
                                        <span className="hora-mensagem">
                                            {/* Mensagens individuais devem ter timestamp ISO para formatar a hora */}
                                            {format(parseISO(mensagem.timestamp), 'HH:mm', { locale: ptBR })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <form className="input-mensagem-container" onSubmit={handleEnviarMensagem}>
                        <input
                            type="text"
                            value={novaMensagemConteudo}
                            onChange={(e) => setNovaMensagemConteudo(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="input-mensagem"
                        />
                        <button type="submit" className="btn-enviar-mensagem">
                            <img src={enviarIcon} alt="Enviar" />
                        </button>
                    </form>
                </>
            ) : (
                <p className="selecione-chat-aviso">Selecione uma conversa para começar a conversar.</p>
            )}
        </div>
    );

    return (
        <div className="tela-conversas">
            {renderListaConversas()}
            {renderChatAtivo()}
        </div>
    );
}
