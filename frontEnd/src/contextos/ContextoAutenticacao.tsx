import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from 'react';

//Tipo de usuário que está logado
interface Usuario {
    _id: number,
    nome: string,
    email: string,
    tipo: 'Cliente' | 'Profissional';
    token?: string;
}

//Tipo do contexto
interface ContextoAutenticacaoProps {
    usuario: Usuario | null;
    login: (dados: Usuario) => void;
    logout: () => void;
    carregando: boolean;
    token: string | null;

}
const ContextoAutenticacao = createContext<ContextoAutenticacaoProps | undefined>(undefined);

export function ProvedorAutenticacao({ children }: { children: ReactNode }){
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const usuarioSalvo = localStorage.getItem('usuario');
        if (usuarioSalvo){
            setUsuario(JSON.parse(usuarioSalvo));
        }
        setCarregando(false);
    }, []);

    const login = (dados: Usuario) => {
        setUsuario(dados);
        localStorage.setItem('usuario', JSON.stringify(dados));
    };

    const logout = () => {
        setUsuario(null);
        localStorage.removeItem('usuario');
    };

    return(
        <ContextoAutenticacao.Provider value={{ usuario, login, logout, carregando, token: usuario?.token || null}}>
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