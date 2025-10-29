import { useEffect, useState, useRef } from "react";
import { connectSocket } from "../services/socket";
import axios from "axios";
import { useAuth } from "../contextos/ContextoAutenticacao";

import './Conversas.css';
import videoligacao from '../assets/telaConversasIcons/videoLigacao.png';
import ligacao from '../assets/telaConversasIcons/ligacao.png';
import enviar from '../assets/telaConversasIcons/enviar.png';
import info from '../assets/telaConversasIcons/info.png';
import fotoPerfilContato from '../assets/telaConversasIcons/profile-circle-svgrepo-com.svg';
import logoYSV from '../assets/telaConversasIcons/logoNomYSV.png';
import config from '../assets/telaConversasIcons/3pontos.png';
import lupaPesquisa from '../assets/telaConversasIcons/lupadPisquisaCinza.png';

export default function Conversas() {
  const { usuario } = useAuth();
  const token = usuario?.token;
  const [socket, setSocket] = useState<any>(null); // ✅ faltava isso
  const [contatos, setContatos] = useState<any[]>([]);
  const [chatAtivo, setChatAtivo] = useState<any | null>(null);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [emChamada, setEmChamada] = useState(false);

  const localvideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  // ✅ Inicializa o socket assim que o token estiver disponível
  useEffect(() => {
    if (!token) return;
    try {
      const novaInstancia = connectSocket(token);
      setSocket(novaInstancia);
    } catch (err) {
      console.error("❌ Erro ao conectar socket:", err);
    }
  }, [token]);

  // Carrega os usuários do banco
  useEffect(() => {
    if (!token || !usuario?._id) return;
    axios.get("http://localhost:5000/api/usuarios", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setContatos(res.data.filter((u: any) => u._id !== usuario._id)))
    .catch((err) => console.error("Erro ao carregar contatos:", err));
  }, [token, usuario?._id]);

  // Configuração do socket com o token e eventos
  useEffect(() => {
    if (!socket || !token) return;

    socket.auth = { token };
    socket.connect();

    socket.on("connect", () => console.log("✅ Socket conectado!"));
    socket.on("disconnect", () => console.log("⚠️ Socket desconectado!"));
    socket.on("AtualizaStatusUsuario", (data: any) => {
      setContatos((prev) =>
        prev.map((c) =>
          c._id === data.userId ? { ...c, statusOnline: data.statusOnline } : c
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [socket, token]);

  // Escuta mensagens do chat ativo
  useEffect(() => {
    if (!socket || !chatAtivo) return;

    socket.emit("JoinChat", { chatID: chatAtivo._id });
    socket.on("messageReceived", (mensagem: any) => {
      setMensagens((prev) => [...prev, mensagem]);
    });

    return () => {
      socket.off("messageReceived");
    };
  }, [socket, chatAtivo]);

  const enviarMensagem = () => {
    if (!socket || novaMensagem.trim() === "" || !chatAtivo) return;

    const msg = {
      chatId: chatAtivo._id,
      conteudo: novaMensagem,
    };

    socket.emit("sendMessage", msg);
    setMensagens((prev) => [
      ...prev,
      { remetente: usuario?._id, conteudo: novaMensagem },
    ]);
    setNovaMensagem("");
  };

  const iniciarChamada = async () => {
    if (!chatAtivo || !socket) return;
    setEmChamada(true);
    peerRef.current = new RTCPeerConnection();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    if (localvideoRef.current) localvideoRef.current.srcObject = stream;
    stream.getTracks().forEach((track) =>
      peerRef.current!.addTrack(track, stream)
    );

    peerRef.current.ontrack = (event) => {
      if (remoteVideoRef.current)
        remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          para: chatAtivo._id,
          candidate: event.candidate,
        });
      }
    };

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);
    socket.emit("offer", { para: chatAtivo._id, offer });
  };

  return (
    <div className="telaConversas">
      <nav className="barraDContatos">
        <header className="cabecalhoContatos">
          <div className="container1">
            <img src={logoYSV} alt="" className="logoYSV" />
            <img src={config} alt="" className="imgConfig" />
          </div>
          <div className="pesquisaContato-mensagem">
            <img src={lupaPesquisa} alt="" />
            <input
              type="text"
              placeholder="Pesquisa nos contatos"
              className="inputPesquisaContato"
            />
          </div>
          <ul className="filtrosMensagens">
            <li>Tudo</li>
            <li>Não Lidas</li>
            <li>Favoritas</li>
            <li>Grupos</li>
          </ul>
        </header>
        <div className="listaContatos">
          {contatos.map((c) => (
            <div
              key={c._id}
              className={`contatoCard ${chatAtivo?._id === c._id ? "ativo" : ""}`}
              onClick={() => setChatAtivo(c)}
            >
              <img
                src={c.fotoPerfil || fotoPerfilContato}
                alt=""
                className="fotoContato"
              />
              <div className="infoContatoCard">
                <h3>{c.nome}</h3>
                <p className={c.statusOnline ? "online" : "offline"}>
                  {c.statusOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="conversa">
        {chatAtivo ? (
          <>
            <header className="cabecalhoConversaContato">
              <div className="infoContato">
                <img
                  src={chatAtivo.fotoPerfil || fotoPerfilContato}
                  alt=""
                  className="fotoPerfilContato"
                />
                <h2>{chatAtivo.nome}</h2>
              </div>

              <div className="acoesCabecalhoConversa">
                <img src={ligacao} alt="" />
                <img src={videoligacao} alt="" onClick={iniciarChamada} />
                <img src={info} alt="" />
              </div>
            </header>

            <div className="Chat">
              {mensagens.map((msg, i) => (
                <div
                  key={i}
                  className={`mensagem ${
                    msg.remetente === usuario?._id ? "minha" : "dele"
                  }`}
                >
                  <p>{msg.conteudo}</p>
                </div>
              ))}
            </div>

            <div className="enviaMensagem">
              <input
                type="text"
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                className="inputEnviaMensagem"
                placeholder="Envie uma mensagem:"
              />
              <button className="botaoenviaMensagem" onClick={enviarMensagem}>
                <img src={enviar} alt="" className="imgbotaoEnviar" />
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
