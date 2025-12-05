import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './ContextoAutenticacao';
import api from '../services/api.ts';

const getSocketBaseUrl = () => {
    const currentBaseUrl = api.defaults.baseURL || '';
    if (currentBaseUrl.endsWith('/api')) {
        return currentBaseUrl.substring(0, currentBaseUrl.length - 4);
    }
    return currentBaseUrl;
};

export interface NotificacaoDados {
    consultaId?: string;
    novaData?: string;
    novoHorario?: string;
    profissionalNome?: string;
    clienteNome?: string;
    outroUsuarioNome?: string;
    nomeUsuario?: string;
    data?: string;
    horario?: string;
    modalidade?: string;
    valor?: number;
    duracao?: number;
    nota?: number;
    comentario?: string;
}

export interface Notificacao {
    _id?: string;
    tipo: string;
    dados: NotificacaoDados;
    timestamp: string;
    lida?: boolean;
}

interface NotificacoesContextType {
    notificacoes: Notificacao[];
    adicionarNotificacao: (notificacao: Notificacao) => void;
    socket: Socket | null;
    limparNotificacoes: () => void;
    notificacoesNaoLidas: number;
    marcarTodasComoLidas: () => Promise<void>;
}

const ContextoNotificacoes = createContext<NotificacoesContextType | undefined>(undefined);

export const useNotificacoes = () => {
    const context = useContext(ContextoNotificacoes);
    if (context === undefined) {
        throw new Error('useNotificacoes deve ser usado dentro de um NotificacoesProvider');
    }
    return context;
};

interface NotificacoesProviderProps {
    children: ReactNode;
}

export const NotificacoesProvider = ({ children }: NotificacoesProviderProps) => {
    const { usuario, token } = useAuth();
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const socketRef = useRef<Socket | null>(null); // Para manter a referência do socket

    const fetchNotificacoes = useCallback(async () => {
        if (!usuario?._id || !token) {
            console.log('DEBUG Frontend - Usuário deslogado ou token ausente, não carregando notificações.');
            setNotificacoes([]);
            return;
        }
        console.log(`DEBUG Frontend - Carregando notificações do banco para usuário: ${usuario._id}`);
        try {
            const response = await api.get('/notificacoes', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotificacoes(response.data);
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    }, [usuario?._id, token]);

    const adicionarNotificacao = useCallback((novaNotificacao: Notificacao) => {
        setNotificacoes((prevNotificacoes) => {
            // Evita duplicatas se a notificação já existe pelo _id
            if (novaNotificacao._id && prevNotificacoes.some(n => n._id === novaNotificacao._id)) {
                return prevNotificacoes;
            }
            return [novaNotificacao, ...prevNotificacoes];
        });
    }, []);

    const limparNotificacoes = useCallback(() => {
        setNotificacoes([]);
    }, []);

    const marcarTodasComoLidas = useCallback(async () => {
        if (!token || !usuario?._id) return;
        try {
            await api.put('/notificacoes/marcar-todas-lidas', {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
        } catch (error) {
            console.error('Erro ao marcar todas as notificações como lidas:', error);
        }
    }, [token, usuario?._id]);

    const notificacoesNaoLidas = notificacoes.filter(n => !n.lida).length;

    // Efeito para carregar notificações iniciais do banco
    useEffect(() => {
        fetchNotificacoes();
    }, [fetchNotificacoes]);

    // Efeito para lidar com eventos de socket
    useEffect(() => {
        console.log('DEBUG Socket - useEffect de socket acionado.');
        if (!usuario?._id || !token) {
            console.log('DEBUG Socket - Usuário deslogado ou token ausente, desconectando socket existente.');
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setSocket(null);
            return;
        }

        const socketBaseUrl = getSocketBaseUrl();

        // CORREÇÃO: Verificação mais robusta para evitar reconexão desnecessária
        // Verifica se já existe um socket conectado para o MESMO usuário e token
        if (
            socketRef.current &&
            socketRef.current.connected &&
            socketRef.current.auth && // Verifica se auth existe
            typeof socketRef.current.auth === 'object' && // Verifica se auth é um objeto
            'token' in socketRef.current.auth && // Verifica se 'token' existe em auth
            (socketRef.current.auth as { token: string }).token === token && // Acessa o token com type assertion
            socketRef.current.io.opts.query?.userId === usuario._id
        ) {
            console.log('DEBUG Socket - Socket já conectado para o mesmo usuário, não reconectando.');
            return;
        }

        console.log(`DEBUG Socket - Conectando em: ${socketBaseUrl} com token: ${token}`);
        const newSocket = io(socketBaseUrl, {
            auth: { token },
            query: { userId: usuario._id }, // Adiciona userId na query para o backend
            transports: ['websocket', 'polling'],
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket conectado com sucesso!');
            // Emitir evento para o backend associar o socket ao usuário
            newSocket.emit('joinRoom', usuario._id);
        });

        newSocket.on('notificacao', (notificacao: Notificacao) => {
            console.log('DEBUG Socket - Notificação recebida via socket:', notificacao);
            adicionarNotificacao(notificacao);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket desconectado.');
            socketRef.current = null;
            setSocket(null);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Erro de conexão do Socket:', err.message);
            socketRef.current = null;
            setSocket(null);
        });

        return () => {
            console.log('DEBUG Socket - cleanup do useEffect de socket.');
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setSocket(null);
        };
    }, [usuario?._id, token, adicionarNotificacao]); // Dependências ajustadas

    return (
        <ContextoNotificacoes.Provider value={{
            notificacoes,
            adicionarNotificacao,
            socket,
            limparNotificacoes,
            notificacoesNaoLidas,
            marcarTodasComoLidas
        }}>
            {children}
        </ContextoNotificacoes.Provider>
    );
};
