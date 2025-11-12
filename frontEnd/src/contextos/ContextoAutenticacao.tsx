import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from 'react';

// Tipo de usuário que está logado
interface Usuario {
    _id: string,
    nome: string,
    email: string,
    fotoPerfil?: string,
    tipoUsuario: 'Cliente' | 'Profissional';
}

// Tipo do contexto
interface ContextoAutenticacaoProps {
    usuario: Usuario | null;
    login: (dados: { usuario: Usuario, token: string }) => void;
    logout: () => void;
    carregando: boolean;
    token: string | null;
    atualizarUsuario: (novosDados: Partial<Usuario>) => void;

}
const ContextoAutenticacao = createContext<ContextoAutenticacaoProps | undefined>(undefined);

export function ProvedorAutenticacao({ children }: { children: ReactNode }){
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const usuarioSalvo = localStorage.getItem('usuario');
        const tokenSalvo = localStorage.getItem('token');
        if (usuarioSalvo && tokenSalvo){
            try{
                setUsuario(JSON.parse(usuarioSalvo));
                setToken(tokenSalvo);
            } catch (e){
                console.error("Erro ao parsear dados do usuário.");
                localStorage.removeItem('usuario');
                localStorage.removeItem('token');
            }
        }
        setCarregando(false);
    }, []);

    const login = (dados: {usuario: Usuario, token: string}) => {
        setUsuario(dados.usuario);
        setToken(dados.token);
        localStorage.setItem('usuario', JSON.stringify(dados.usuario));
        localStorage.setItem('token', dados.token);
    };

    const logout = () => {
        setUsuario(null);
        setToken(null);
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
    };

    const atualizarUsuario = ( novosDados: Partial<Usuario>) => {
        if (usuario){
            const usuarioAtualizado = { ...usuario, ...novosDados};
            setUsuario(usuarioAtualizado);
            localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
        }
    };

    return(
        <ContextoAutenticacao.Provider value={{ usuario, login, logout, carregando, token, atualizarUsuario }}>
            {children}
        </ContextoAutenticacao.Provider>
     );
}

export function useAuth(){
    const context = useContext(ContextoAutenticacao);
    if(!context){
        throw new Error('UseAuth deve ser usado dentro de um provedorAutenticacao');
    }
    return context;
}