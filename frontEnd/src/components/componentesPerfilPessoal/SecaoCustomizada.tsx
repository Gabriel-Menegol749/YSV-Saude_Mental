import { useState } from "react";
import "./SecaoCustomizada.css";

interface Secao {
    _id?: string;
    titulo: string;
    conteudo: string;
}

interface SecaoCustomizadaProps {
    modo: "visualizacao" | "edicao";
    isMeuPerfil?: boolean;
    secoes: Secao[];
    onAddSecao?: (titulo: string, conteudo: string) => void;
    onDelete?: (_id: string) => void;
    onEdit?: (_id: string, campo: "titulo" | "conteudo", valor: string) => void;
}

export default function SecaoCustomizada({
    modo,
    isMeuPerfil = false,
    secoes,
    onAddSecao,
    onDelete,
    onEdit
}: SecaoCustomizadaProps) {

    const isEdicao = modo === "edicao" && isMeuPerfil;

    const [criando, setCriando] = useState(false);
    const [titulo, setTitulo] = useState("");
    const [conteudo, setConteudo] = useState("");

    const salvarSecao = () => {
        if (!titulo.trim() || !onAddSecao) return;

        onAddSecao(titulo.trim(), conteudo.trim());
        setTitulo("");
        setConteudo("");
        setCriando(false);
    };

    return (
        <div className="customizadaContainer">

            {secoes.map((secao, index) => (
                <div key={secao._id || `secao-${index}`} className="secaoAdicionada" >
                    <div className="secaoHeader">
                        {isEdicao ? (
                            <input
                                className="inputSecaoTitulo"
                                value={secao.titulo}
                                onChange={(e) => {
                                    if (onEdit && secao._id) {
                                        onEdit(secao._id, "titulo", e.target.value);
                                    }
                                }}
                            />
                        ) : (
                            <h1 className="secaoTitulo">{secao.titulo}</h1>
                        )}

                        {isEdicao && (
                            <button
                                className="botaoDeletar"
                                onClick={() => {
                                    if (onDelete && secao._id) {
                                        onDelete(secao._id);
                                    }
                                }}
                            >
                                Deletar
                            </button>
                        )}
                    </div>

                    <hr />

                    <div className="secaoConteudo">
                        {isEdicao ? (
                            <textarea
                                className="textareaSecaoConteudo"
                                value={secao.conteudo}
                                onChange={(e) => {
                                    if (onEdit && secao._id) {
                                        onEdit(secao._id, "conteudo", e.target.value);
                                    }
                                }}
                            />
                        ) : (
                            <p>{secao.conteudo}</p>
                        )}
                    </div>
                </div>
            ))}

            {isEdicao && (
                <div className="novaSecaoContainer">

                    {!criando ? (
                        <div className="botaoNovaSecao" onClick={() => setCriando(true)}>
                            + Adicionar nova seção
                        </div>
                    ) : (
                        <div className="formNovaSecao">

                            <input
                                className="inputSecaoTitulo"
                                placeholder="Título da nova seção"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                            />

                            <hr />

                            <textarea
                                className="textareaSecaoConteudo"
                                placeholder="Digite o conteúdo da nova seção..."
                                value={conteudo}
                                onChange={(e) => setConteudo(e.target.value)}
                            />

                            <div className="botoesNovaSecao">
                                <button className="botaoSalvarSecao" onClick={salvarSecao}>
                                    Salvar
                                </button>

                                <button
                                    className="botaoCancelarSecao"
                                    onClick={() => setCriando(false)}
                                >
                                    Cancelar
                                </button>
                            </div>

                        </div>
                    )}

                </div>
            )}

        </div>
    );
}
