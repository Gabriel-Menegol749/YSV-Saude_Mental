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
    marcarTodasComoLidas: () => void;
}

const ContextoNotificacoes = createContext<NotificacoesContextType | undefined>(undefined);

export const useNotificacoes = () => {
    const context = useContext(ContextoNotificacoes);
    if (!context) {
        throw new Error('useNotificacoes must be used within a NotificacoesProvider');
    }
    return context;
};

export const NotificacoesProvider = ({ children }: { children: ReactNode }) => {
    const { usuario, token } = useAuth();
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState<number>(0);
    const socketRef = useRef<Socket | null>(null);

    const adicionarNotificacao = useCallback((notificacao: Notificacao) => {
        setNotificacoes(prev => [{ ...notificacao, lida: false }, ...prev]);
        setNotificacoesNaoLidas(prev => prev + 1);
    }, []);

    const marcarTodasComoLidas = useCallback(async () => {
        if (usuario && token) {
            try {
                await api.put('/api/notificacoes/marcar-todas-como-lidas', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
                setNotificacoesNaoLidas(0);
                console.log('DEBUG Frontend - Notificações marcadas como lidas no banco.');
            } catch (error) {
                console.error('Erro ao marcar notificações como lidas no banco:', error);
            }
        }
    }, [usuario, token]);

    const limparNotificacoes = useCallback(async () => {
        if (usuario && token) {
            try {
                await api.delete('/notificacoes', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setNotificacoes([]);
                setNotificacoesNaoLidas(0);
                console.log('DEBUG Frontend - Notificações apagadas do banco.');
            } catch (error) {
                console.error('Erro ao apagar notificações do banco:', error);
            }
        }
    }, [usuario, token]);

   useEffect(() => {
    const carregarHistorico = async () => {
        try {
        if (usuario && token) {
            console.log('DEBUG Frontend - Carregando notificações do banco para usuário:', usuario._id);

            const { data } = await api.get('/notificacoes', {
            headers: { Authorization: `Bearer ${token}` }
            });

            console.log('DEBUG Frontend - Resposta de /notificacoes:', data);

            const lista = Array.isArray(data) ? data : [];
            const naoLidas = lista.filter((n: Notificacao) => !n.lida).length;

            setNotificacoes(lista);
            setNotificacoesNaoLidas(naoLidas);

            console.log('DEBUG Frontend - Notificações carregadas do banco:', lista);
        } else {
            setNotificacoes([]);
            setNotificacoesNaoLidas(0);
        }
        } catch (err) {
        console.error('Erro ao carregar histórico de notificações:', err);
        setNotificacoes([]);
        setNotificacoesNaoLidas(0);
        }
    };

    carregarHistorico();
    }, [usuario, token]);


    useEffect(() => {
  // se não tem usuario/token, só garante limpeza
  if (!usuario || !token) {
    console.log('DEBUG Socket - Usuário deslogado ou token ausente, desconectando socket existente.');
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
    setNotificacoes([]);
    setNotificacoesNaoLidas(0);
    return;
  }

  // se já tem socket conectado, não faz nada
  if (socketRef.current && socketRef.current.connected) {
    return;
  }

  const socketBaseUrl = getSocketBaseUrl();
  console.log('DEBUG Socket - Conectando em:', socketBaseUrl, 'com token:', token);

  const newSocket = io(socketBaseUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    withCredentials: true,
  });

  socketRef.current = newSocket;
  setSocket(newSocket);

  newSocket.on('connect', () => {
    console.log('Socket conectado:', newSocket.id);
    newSocket.emit('joinRoom', usuario._id);
  });

  newSocket.on('notificacao', (notificacao: Notificacao) => {
    console.log('🔥 Notificação recebida do servidor via Socket.IO:', notificacao);
    setNotificacoes(prev => [{ ...notificacao, lida: false }, ...prev]);
    setNotificacoesNaoLidas(prev => prev + 1);
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
}, [usuario, token]); // note o usuario?._id em vez do objeto inteiro


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
