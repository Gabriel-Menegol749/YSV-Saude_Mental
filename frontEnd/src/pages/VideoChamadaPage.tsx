import  { useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { useAuth } from "../contextos/ContextoAutenticacao";
import './VideoChamadaPage.css';

const VideoChamadaPage = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const elementRef = useRef<HTMLDivElement>(null);
    const zpInstanceRef = useRef<ZegoUIKitPrebuilt | null>(null);

    const userID = usuario?._id;
    const userName = usuario?.nome || 'Usuário Desconhecido';
    const appID = Number(import.meta.env.VITE_ZEGO_APP_ID); // Mantemos o APP_ID do .env
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET; // Você precisará adicionar esta variável ao seu .env no frontend!

    const MyMeeting = useCallback(async (element: HTMLDivElement | null) => {
        if (!element) {
            console.warn("DEBUG Frontend - Elemento container não disponível para MyMeeting.");
            return;
        }

        // Se a instância já existe, não a recria
        if (zpInstanceRef.current) {
            console.log("DEBUG Frontend - Instância Zego já existe, não recriando.");
            return;
        }

        if (!appID || !serverSecret || !userID || !roomId) {
            console.error("DEBUG Frontend - APP_ID, SERVER_SECRET, UserID ou RoomID ausentes. Não é possível gerar o kitToken.");
            alert("Erro de configuração da videochamada. Por favor, verifique as credenciais.");
            return;
        }

        console.log("DEBUG Frontend - Gerando kitToken diretamente no frontend...");
        try {
            // Geração do kitToken diretamente no frontend, como no tutorial
            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                appID,
                serverSecret,
                roomId,
                userID,
                userName
            );

            if (!kitToken) {
                console.error("DEBUG Frontend - Falha ao gerar o kitToken Zego.");
                alert("Ocorreu um erro ao gerar o token da videochamada. Por favor, tente novamente.");
                return;
            }

            console.log("DEBUG Frontend - kitToken gerado com sucesso. Criando instância ZegoUIKitPrebuilt...");

            // Cria a instância do ZegoUIKitPrebuilt com o kitToken
            const zp = ZegoUIKitPrebuilt.create(kitToken);
            zpInstanceRef.current = zp;

            if (!zp) {
                console.error("DEBUG Frontend - Falha ao criar instância do ZegoUIKitPrebuilt.");
                return;
            }

            console.log("DEBUG Frontend - Instância do ZegoUIKitPrebuilt criada. Juntando-se à sala...");

            // Configurações da sala
            zp.joinRoom({
                container: element,
                scenario: {
                    mode: ZegoUIKitPrebuilt.VideoConference,
                },
                sharedLinks: [
                    {
                        name: "Copiar Link",
                        url: window.location.protocol + '//' + window.location.host + window.location.pathname,
                    },
                ],

                onLeaveRoom: () => { navigate('/'); },
            });

            console.log("DEBUG Frontend - ZegoUIKitPrebuilt.joinRoom() chamado com sucesso.");
        } catch (error) {
            console.error("DEBUG Frontend - Erro ao inicializar Zego:", error);
            alert("Ocorreu um erro ao iniciar a videochamada. Por favor, tente novamente.");
        }
    }, [appID, serverSecret, userID, userName, roomId, navigate]); // Adicione todas as dependências

    useEffect(() => {
        const timer = setTimeout(() => {
            MyMeeting(elementRef.current);
        }, 100);

        return () => {
            console.log("DEBUG Frontend - Função de limpeza do useEffect acionada.");
            clearTimeout(timer);
            if (zpInstanceRef.current) {
                console.log("DEBUG Frontend - Destruindo instância Zego.");
                zpInstanceRef.current.destroy();
                zpInstanceRef.current = null;
            }
            if (elementRef.current) {
                elementRef.current.innerHTML = '';
            }
        };
    }, [MyMeeting]);

    if (!usuario) {
        return (
            <div className="video-chamada-page">
                <p className="video-error">Você precisa estar logado para acessar a videochamada.</p>
                <button onClick={() => navigate('/login')}>Ir para Login</button>
            </div>
        );
    }

    if (!roomId) {
        return (
            <div className="video-chamada-page">
                <p className="video-error">ID da sala não fornecido. Não é possível iniciar a videochamada.</p>
                <button onClick={() => navigate('/agendamentos')}>Voltar para Agendamentos</button>
            </div>
        );
    }

    return (
        <div className="video-chamada-container">
            <div ref={elementRef} style={{ width: '100%', height: '500px', border: '1px solid #ccc' }}>
                <p className="video-loading">Carregando sua videochamada...</p>
            </div>
        </div>
    );
};

export default VideoChamadaPage;