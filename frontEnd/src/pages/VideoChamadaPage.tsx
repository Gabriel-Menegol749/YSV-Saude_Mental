import { useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { useAuth } from "../contextos/ContextoAutenticacao";

const API_BASE_URL = 'http://localhost:5000';

const VideoChamadaPage = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const elementRef = useRef<HTMLDivElement>(null);

    const userID = usuario?._id;
    const userName = usuario?.nome || 'Usuário Desconhecido';

    const getZegoToken = useCallback(async () => {
        if (!userID || !roomId) {
            return null;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/zego/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: userID, roomId })
            });

            if (!response.ok) {
                throw new Error(`Erro ao obter token ZegoCloud: ${response.statusText}`);
            }

            const data = await response.json();
            return data.token;
        } catch (error) {
            return null;
        }
    }, [userID, roomId]);

    useEffect(() => {
        const initZego = async () => {
            if (!elementRef.current || !userID || !roomId) return;

            const appID = Number(import.meta.env.VITE_ZEGOCLOUD_APP_ID);
            if (!appID) {
                return;
            }

            const token = await getZegoToken();
            if (!token) {
                return;
            }

            const zp = ZegoUIKitPrebuilt.create(token);

            zp.joinRoom({
                container: elementRef.current,
                sharedLinks: [{
                    name: 'Link da Sala',
                    url: window.location.protocol + '//' + window.location.host + window.location.pathname + '?roomId=' + roomId,
                }],
                scenario: {
                    mode: ZegoUIKitPrebuilt.VideoConference,
                },
                onLeaveRoom: () => {
                    navigate('/agendamentos');
                },
            });
        };

        initZego();

        return () => {
            // ZegoUIKitPrebuilt não expõe um método destroy() diretamente na instância retornada por create()
            // A limpeza é gerenciada internamente pelo SDK ao sair da sala ou desmontar o container.
            // Para garantir, podemos tentar limpar o container se necessário, mas o SDK geralmente lida com isso.
            if (elementRef.current) {
                elementRef.current.innerHTML = ''; // Limpa o conteúdo do container
            }
        };
    }, [userID, roomId, userName, navigate, getZegoToken]);

    if (!userID || !roomId) {
        return <div className="video-error">Informações de usuário ou sala ausentes.</div>;
    }

    return (
        <div className="video-chamada-page">
            <div className="video-container" ref={elementRef}>
                <div className="video-loading">Carregando videochamada...</div>
            </div>
        </div>
    );
};

export default VideoChamadaPage;
