import { useState } from "react";
import "./NovaSecao.css";

interface Props {
    modo: "visualizacao" | "edicao";
    onAddSecao: (titulo: string, conteudo: string) => void;
}

export default function NovaSecao({ modo, onAddSecao }: Props) {
    const [editando, setEditando] = useState(false);
    const [titulo, setTitulo] = useState("");
    const [conteudo, setConteudo] = useState("");

    const salvarSecao = () => {
        if (!titulo.trim() || !conteudo.trim()) return;
        onAddSecao(titulo, conteudo);
        setTitulo("");
        setConteudo("");
        setEditando(false);
    };

    if (modo !== "edicao") return null;

    return (
        <div className="novaSecaoContainer">
            {!editando ? (
                <div
                    className="botaoNovaSecao"
                    onClick={() => setEditando(true)}
                >
                    + Adicionar nova seção
                </div>
            ) : (
                <div className="formNovaSecao">
                    <input
                        type="text"
                        placeholder="Título da nova seção"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                    />
                    <hr />
                    <textarea
                        placeholder="Digite o conteúdo da nova seção..."
                        value={conteudo}
                        onChange={(e) => setConteudo(e.target.value)}
                    ></textarea>
                    <div className="botoesNovaSecao">
                        <button onClick={salvarSecao}>Salvar</button>
                        <button
                            className="cancelar"
                            onClick={() => setEditando(false)}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
