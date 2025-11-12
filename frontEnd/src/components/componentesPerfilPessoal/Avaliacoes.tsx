import { useState } from "react";
import "./Avaliacoes.css";

interface Avaliacao {
    nome: string;
    comentario: string;
    nota: number;
}

interface Props {
    usuario: any;
    modo: "visualizacao" | "edicao";
}

export default function Avaliacoes({ usuario, modo }: Props) {
    const [avaliacoes] = useState<Avaliacao[]>([
        {
            nome: "Anônimo",
            comentario: "Profissional super adequado, ótimo atendimento, me ajudou verdadeiramente pipipi popopo.",
            nota: 5,
        },
        {
            nome: "Anônimo",
            comentario: "Atendimento ótimo, muito compreensivo e paciente. Recomendo demais!",
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

    return (
        <div className="avaliacoesPerfil">
            <h2>
                Avaliações | Confira os Feedbacks de{" "}
                {usuario?.nome || "Profissional"}
            </h2>
            <hr />
            <div className="avaliacoesUsuarios">
                {avaliacoes.map((avaliacao, index) => (
                    <div key={index} className="avaliacao">
                        <h2>{avaliacao.nome}</h2>
                        <hr />
                        <div className="comentario">
                            <p>{avaliacao.comentario}</p>
                        </div>
                        <p className="vermaiavaliacao">Ver mais...</p>
                        <h2>Nota:</h2>
                        <p className="estrelas">{renderEstrelas(avaliacao.nota)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
