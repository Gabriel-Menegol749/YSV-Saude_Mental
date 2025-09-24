import React, { useState, useEffect, createContext, useContext } from "react";

type ThemeContextType = {
    tema: string;
    toggleTema: () => void;
    tamanhoFonte: string;
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
    const [tamanhoFonte, setTamanhoFonte] = useState('normal');


    //Função de alteração de temas, claro ou escuro
    const toggleTema = () => {
        setTema(temaAtual=> (temaAtual === 'Claro' ? 'Escuro' : 'Claro'));
    };
    useEffect(() => {
        document.body.className = tema === 'Escuro' ? 'Tema-Escuro' : '';
        localStorage.setItem('Tema', tema);
    }, [tema]);

    //Função de alterar o tamanho da fonte do sistema, reduzido, normal ou grande
    const handleTamanhoFonte = (event: React.ChangeEvent<HTMLInputElement>) => {
        const novoTamanho = event.target.value;
        setTamanhoFonte(novoTamanho);
    }

    useEffect(() => {
        let fatorAjuste = 1;
        if (tamanhoFonte === 'reduzido'){
            fatorAjuste = 0.8;
        } else if (tamanhoFonte === 'grande'){
            fatorAjuste = 1.2;
        }
        document.documentElement.style.setProperty('--ajuste-fonte', String(fatorAjuste));
    }, [tamanhoFonte]);
    //Função de manter salvo o tema escolhido pelo usuário
    useEffect(() => {
        const temaSalvo = localStorage.getItem('Tema');
        if(temaSalvo){
            setTema(temaSalvo);
        }
    }, []);

    return(
        <ThemeContext.Provider value={{
            tema,
            toggleTema,
            tamanhoFonte,
            handleTamanhoFonte
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
