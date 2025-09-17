import React, { useState, useEffect, createContext, useContext } from "react";

type ThemeContextType = {
    tema: string;
    toggleTema: () => void;
    tamanhoFonte: number;
    handleTamanhoFonte: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const usaTema = () => {
    const context = useContext(ThemeContext);
    if(!context){
        throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
    }
    return context;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tema, setTema] = useState('Claro');
    const [tamanhoFonte, setTamanhoFonte] = useState(20);

    useEffect(() => {
        const temaSalvo = localStorage.getItem('Tema');
        if(temaSalvo){
            setTema(temaSalvo);
        }
    }, []);

    useEffect(() => {
        document.body.className = tema === 'Escuro' ? 'Tema-Escuro' : '';
        localStorage.setItem('Tema', tema);
    }, [tema]);

    const toggleTema = () => {
        setTema(temaAtual=> (temaAtual === 'Claro' ? 'Escuro' : 'Claro'));
    };

    const handleTamanhoFonte = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTamanhoFonte(Number(event.target.value));
    }

    useEffect(() => {
        document.body.style.fontSize = `${tamanhoFonte}px`;
    }, [tamanhoFonte]);

    return(
        <ThemeContext.Provider value={{
            tema,
            toggleTema,
            tamanhoFonte,
            handleTamanhoFonte
        }}>
            {children}
        </ThemeContext.Provider>
    )
}