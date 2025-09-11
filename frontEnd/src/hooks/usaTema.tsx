import { useState, useEffect, createContext, useContext } from "react";

type ThemeContextType = {
    tema: string;
    toggleTema: () => void;

    aumentaFonte: () => void;
    diminuiFonte: () => void;
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
    const [tamanhaFonte, setTamanhoFonte] = useState(16);

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

    const aumentaFonte = () => {
        setTamanhoFonte(prevSize => prevSize < 24 ? prevSize + 2 : prevSize);
    };
    const diminuiFonte = () => {
        setTamanhoFonte(prevSize => prevSize > 12 ? prevSize - 2 : prevSize);
    }
    return(
        <ThemeContext.Provider value={{
            tema,
            toggleTema,
            aumentaFonte,
            diminuiFonte
        }}>
            {children}
        </ThemeContext.Provider>
    )
}