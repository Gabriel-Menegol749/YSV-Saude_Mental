import { useState, useRef, useEffect } from "react";
import "./Avaliacoes.css";

interface Avaliacao {
    nome: string;
    comentario: string;
    nota: number;
}

interface Props {
    usuario: any;
    modo: "visualizacao" | "edicao";
    isMeuPerfil: boolean;
    onSave: (dados: any) => Promise<void>;
}

/*Aqui deve receber os dados de avaliações posteriores*/
export default function Avaliacoes({ usuario }: Props) {
    const [ indiceExpandido, setIndiceExpandido ] = useState<number>(-1);
    const [ showVerMais, setShowVerMais ] = useState<boolean[]>([]);
    const comentariosRef = useRef<(HTMLDivElement | null)[]>([]);

    const [ avaliacoes ] = useState<Avaliacao[]>([
        {
            nome: "Anônimo",
            comentario: "Profissional super adequado, ótimo atendimento, me ajudou verdadeiramente pipipi popopo. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
            nota: 5,
        },
        {
            nome: "Anônimo",
            comentario: "Atendimento ótimo, muito compreensivo e paciente. Recomendo demais! É uma profissional excelente e atenciosa em todas as sessões.",
            nota: 4,
        },
        {
            nome: "Anônimo",
            comentario: "Achei a sessão produtiva, mas poderia ter durado um pouco mais.",
            nota: 3,
        },
    ]);

    const renderEstrelas = (nota: number) => {
        return "⭐".repeat(nota) + "☆".repeat(5 - nota);
    };

    const toggleExpandir = (index: number) => {
        setIndiceExpandido(indiceExpandido === index ? -1 : index);
    };

    useEffect(() => {
        const needsButton = avaliacoes.map((_, index) => {
            const ref = comentariosRef.current[index];
            if(ref){
                return ref.scrollHeight > 250;
            }
            return false;
        })
        setShowVerMais(needsButton);
    }, [avaliacoes.length]);

    useEffect(() => {
        if (indiceExpandido !== -1 && showVerMais.length === avaliacoes.length) {
            const newShowVerMais = [...showVerMais];
            newShowVerMais[indiceExpandido] = true;
            setShowVerMais(newShowVerMais);
        }
    }, [indiceExpandido, avaliacoes.length, showVerMais.length]);

    return (
        <div className="avaliacoesPerfil">
            <h2>
                Avaliações | Confira os Feedbacks de{" "}
                {usuario?.nome || "Profissional"}
            </h2>
            <hr />
            <div className="avaliacoesUsuarios">
                {avaliacoes.map((avaliacao, index) => {
                    const estaExpandido = indiceExpandido === index;
                const comentarioClass = `comentario ${estaExpandido ? "expandido" : "colapsado"}`;
                    return(
                        <div key={index} className="avaliacao">
                            <p className="nomeUserAvaliacao">{avaliacao.nome}</p>
                            <hr />
                            <div ref={el => { comentariosRef.current[index] = el; }} className={comentarioClass}>
                                <p>{avaliacao.comentario}</p>
                            </div>
                            {(estaExpandido || showVerMais[index]) && (
                                <div className="containervermaisAv">
                                    <p className="vermaiavaliacao" onClick={() => toggleExpandir(index)}>
                                        {estaExpandido ? "Ver menos..." : "Ver mais..."}
                                    </p>
                                </div>
                            )}
                            <div className="nota">
                                <p className="notaPLabel">Nota:</p>
                                <p className="estrelas">{renderEstrelas(avaliacao.nota)}</p>
                                </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}