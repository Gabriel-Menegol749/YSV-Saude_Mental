import { useEffect, useState, useRef, useCallback } from "react";
import { connectSocket } from "../services/socket"; //Ainda precisamos deste arquivo?
import axios from "axios";
import { useAuth } from "../contextos/ContextoAutenticacao";
import { useNavigate } from "react-router-dom";

// Importe seus ícones
import enviar from "../assets/telaConversasIcons/enviar.png";
import videoligacao from "../assets/telaConversasIcons/videoLigacao.png";
import ligacao from "../assets/telaConversasIcons/ligacao.png";
import info from "../assets/telaConversasIcons/info.png";
import fotoPerfilContato from '../assets/profile-circle-svgrepo-com.svg';


// Interfaces
interface Contato {
    _id: string;
    nome: string;
    fotoPerfil?: string;
    ultimaMensagem?: string;
    timestampUltimaMensagem?: string;
}

interface Mensagem {
    remetente: string;
    conteudo: string;
    timestamp: string;
}

// URL base da sua API
const API_BASE_URL = 'http://localhost:5000'

export default function Conversas() {
    const { usuario, token } = useAuth();
    const navigate = useNavigate();
    const [contatos, setContatos] = useState<Contato[]>([]);
    const [chatAtivo, setChatAtivo] = useState<Contato | null>(null);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [novaMensagem, setNovaMensagem] = useState("");
    const socketRef = useRef<any>(null); // Ref para o socket

    const chatContainerRef = useRef<HTMLDivElement>(null); // Ref para a rolagem do chat

    // Função para rolar o chat para a última mensagem
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };
    // ✅ Efeito para conectar/desconectar o socket e ouvir mensagens
    useEffect(() => {
        if (!usuario || !token) {
            // Se não houver usuário ou token, não conecta o socket
            console.log("Usuário não autenticado, socket não será conectado.");
            return;
        }

        // Conecta o socket
        socketRef.current = connectSocket(token);

        // Ouve por mensagens recebidas
        socketRef.current.on("receberMensagem", (mensagem: Mensagem) => {
            console.log("Mensagem recebida:", mensagem);
            setMensagens((prevMensagens) => [...prevMensagens, mensagem]);
            // Atualiza a última mensagem do contato ativo, se for o caso
            setContatos((prevContatos) =>
                prevContatos.map((c) =>
                    c._id === mensagem.remetente || c._id === chatAtivo?._id
                        ? { ...c, ultimaMensagem: mensagem.conteudo, timestampUltimaMensagem: mensagem.timestamp }
                        : c
                )
            );
        });

        // Ouve por confirmação de mensagem enviada (opcional, para feedback)
        socketRef.current.on("mensagemEnviada", (mensagem: Mensagem) => {
            console.log("Mensagem enviada confirmada:", mensagem);
            // Se precisar de alguma lógica após a confirmação do servidor
        });

        // Limpeza: desconecta o socket ao desmontar o componente
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                console.log("Socket desconectado.");
            }
        };
    }, [usuario, token, chatAtivo?._id]); // Dependências: reconecta se usuário ou token mudar

    // ✅ Efeito para carregar contatos e mensagens do chat ativo
    useEffect(() => {
        const carregarContatos = async () => {
            if (!token) return;
            try {
                const response = await axios.get(`${API_BASE_URL}/api/conversas/contatos`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setContatos(response.data);
            } catch (error) {
                console.error("Erro ao carregar contatos:", error);
            }
        };

        const carregarMensagens = async () => {
            if (!chatAtivo || !token) return;
            try {
                const response = await axios.get(`${API_BASE_URL}/api/conversas/${chatAtivo._id}/mensagens`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMensagens(response.data);
            } catch (error) {
                console.error("Erro ao carregar mensagens:", error);
            }
        };

        carregarContatos();
        carregarMensagens();
    }, [token, chatAtivo]); // Recarrega contatos/mensagens se o token ou chatAtivo mudar

    // ✅ Efeito para rolar o chat para o final sempre que as mensagens mudarem
    useEffect(() => {
        scrollToBottom();
    }, [mensagens]);

    // ✅ Função para selecionar um chat
    const selecionarChat = (contato: Contato) => {
        setChatAtivo(contato);
        setMensagens([]); // Limpa mensagens ao trocar de chat
        setNovaMensagem(""); // Limpa o campo de nova mensagem
    };

    // ✅ Função para enviar mensagem
    const enviarMensagem = () => {
        if (!novaMensagem.trim() || !chatAtivo || !usuario || !socketRef.current) {
            return;
        }

        const mensagemParaEnviar: Mensagem = {
            remetente: usuario._id,
            conteudo: novaMensagem,
            timestamp: new Date().toISOString(),
        };

        // Emite a mensagem via socket
        socketRef.current.emit("enviarMensagem", {
            destinatarioId: chatAtivo._id,
            mensagem: mensagemParaEnviar,
        });

        // Adiciona a mensagem localmente para feedback imediato
        setMensagens((prevMensagens) => [...prevMensagens, mensagemParaEnviar]);
        setNovaMensagem(""); // Limpa o input
        scrollToBottom(); // Rola para a última mensagem
    };

    // ✅ Função para iniciar a videochamada
    const iniciarChamada = useCallback(async () => {
        if (!chatAtivo || !usuario || !token) {
            console.error("Não é possível iniciar chamada: chat ativo, usuário ou token ausente.");
            return;
        }

        // Usamos o ID do chat como roomID para a videochamada
        const roomID = chatAtivo._id;

        try {
            // Requisição ao backend para obter o token Zego
            const response = await axios.post(
                `${API_BASE_URL}/api/zego/token`,
                { roomID },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const { token: zegoToken, userID, roomID: returnedRoomID } = response.data;

            if (zegoToken && userID && returnedRoomID) {
                console.log("Token Zego obtido com sucesso. Redirecionando para a chamada.");
                // Redireciona para a página de videochamada
                navigate(`/videochamada/${returnedRoomID}`);
            } else {
                console.error("Resposta do token Zego incompleta:", response.data);
                alert("Erro ao iniciar a videochamada. Tente novamente.");
            }
        } catch (error) {
            console.error("Erro ao obter token Zego:", error);
            alert("Não foi possível iniciar a videochamada. Verifique sua conexão.");
        }
    }, [chatAtivo, usuario, token, navigate]);


    return (
        <div className="paginaConversas">
            <div className="listaContatos">
                <h2>Contatos</h2>
                {contatos.length === 0 ? (
                    <p>Nenhum contato disponível.</p>
                ) : (
                    contatos.map((contato) => (
                        <div
                            key={contato._id}
                            className={`cardContato ${chatAtivo?._id === contato._id ? "ativo" : ""}`}
                            onClick={() => selecionarChat(contato)}
                        >
                            <img
                                src={contato.fotoPerfil || fotoPerfilContato}
                                alt="Foto perfil"
                                className="fotoPerfilContato"
                            />
                            <div className="infoContatoCard">
                                <h3>{contato.nome}</h3>
                                {contato.ultimaMensagem && (
                                    <p className="ultimaMensagem">{contato.ultimaMensagem}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="areaChat">
                {chatAtivo ? (
                    <>
                        <header className="cabecalhoConversaContato">
                            <div className="infoContato">
                                <img
                                    src={chatAtivo.fotoPerfil || fotoPerfilContato}
                                    alt="Foto perfil"
                                    className="fotoPerfilContato"
                                />
                                <h2>{chatAtivo.nome}</h2>
                            </div>

                            <div className="acoesCabecalhoConversa">
                                {/* Você pode adicionar lógica para o botão de ligação de áudio aqui */}
                                <img src={ligacao} alt="Ligação de Áudio" />
                                <img src={videoligacao} alt="Video Chamada" onClick={iniciarChamada} />
                                <img src={info} alt="Informações do Contato" />
                            </div>
                        </header>

                        <div className="Chat" ref={chatContainerRef}> {/* ✅ Adicionado ref para rolagem */}
                            {mensagens.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`mensagem ${msg.remetente === usuario?._id ? "minha" : "dele"}`}
                                >
                                    <p>{msg.conteudo}</p>
                                    <span className="timestampMensagem">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="enviaMensagem">
                            <input
                                type="text"
                                value={novaMensagem}
                                onChange={(e) => setNovaMensagem(e.target.value)}
                                onKeyPress={(e) => { // ✅ Adicionado envio com Enter
                                    if (e.key === 'Enter') {
                                        enviarMensagem();
                                    }
                                }}
                                className="inputEnviaMensagem"
                                placeholder="Envie uma mensagem:"
                            />
                            <button className="botaoenviaMensagem" onClick={enviarMensagem}>
                                <img src={enviar} alt="Enviar" className="imgbotaoEnviar" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="semChat">Selecione um contato para conversar</div>
                )}
            </div>
        </div>
    );
}
