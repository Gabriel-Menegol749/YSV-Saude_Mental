import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from 'react';
import api from '../services/api.ts';

const getMediaBaseUrl = () => {
    const currentBaseUrl = api.defaults.baseURL || '';
    if (currentBaseUrl.endsWith('/api')) {
        return currentBaseUrl.substring(0, currentBaseUrl.length - 4);
    }
    return currentBaseUrl;
};

interface Usuario {
    _id: string,
    nome: string,
    email: string,
    fotoPerfil?: string,
    tipoUsuario: 'Cliente' | 'Profissional';
}

interface ContextoAutenticacaoProps {
    usuario: Usuario | null;
    login: (dados: { usuario: Usuario, token: string }) => void;
    logout: () => void;
    carregando: boolean;
    token: string | null;
    atualizarUsuario: (novosDados: Partial<Usuario>) => void;
}

const ContextoAutenticacao = createContext<ContextoAutenticacaoProps | undefined>(undefined);

const normalizarFotoPerfilUrl = (url?: string) => {
    if (!url) return '/imagens/default-profile.png';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `${getMediaBaseUrl()}${url}`;
};

export function ProvedorAutenticacao({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const usuarioSalvo = localStorage.getItem('usuario');
        const tokenSalvo = localStorage.getItem('token');

        if (usuarioSalvo && tokenSalvo) {
            try {
                const parsedUsuario: Usuario = JSON.parse(usuarioSalvo);
                const usuarioComFotoNormalizada: Usuario = {
                    ...parsedUsuario,
                    fotoPerfil: normalizarFotoPerfilUrl(parsedUsuario.fotoPerfil),
                };
                setUsuario(usuarioComFotoNormalizada);
                setToken(tokenSalvo);
            } catch (e) {
                console.error("Erro ao parsear dados do usuário ou foto de perfil do localStorage:", e);
                localStorage.removeItem('usuario');
                localStorage.removeItem('token');
                setUsuario(null);
                setToken(null);
            }
        }
        setCarregando(false);
    }, []);

    const login = (dados: { usuario: Usuario, token: string }) => {
        const usuarioLogado: Usuario = {
            ...dados.usuario,
            fotoPerfil: normalizarFotoPerfilUrl(dados.usuario.fotoPerfil),
        };
        setUsuario(usuarioLogado);
        setToken(dados.token);
        localStorage.setItem('usuario', JSON.stringify(usuarioLogado));
        localStorage.setItem('token', dados.token);
        console.log("Usuário logado e foto normalizada:", usuarioLogado.fotoPerfil);
    };

    const logout = () => {
        setUsuario(null);
        setToken(null);
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
    };

    const atualizarUsuario = (novosDados: Partial<Usuario>) => {
        if (usuario) {
            const novosDadosNormalizados: Partial<Usuario> = { ...novosDados };
            if (novosDados.fotoPerfil !== undefined) {
                novosDadosNormalizados.fotoPerfil = normalizarFotoPerfilUrl(novosDados.fotoPerfil);
            }
            const usuarioAtualizado = { ...usuario, ...novosDadosNormalizados };
            setUsuario(usuarioAtualizado);
            localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
            console.log("Usuário atualizado e foto normalizada:", usuarioAtualizado.fotoPerfil);
        }
    };

    return (
        <ContextoAutenticacao.Provider value={{ usuario, login, logout, carregando, token, atualizarUsuario }}>
            {children}
        </ContextoAutenticacao.Provider>
    );
}

export function useAuth() {
    const context = useContext(ContextoAutenticacao);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um ProvedorAutenticacao');
    }
    return context;
}
