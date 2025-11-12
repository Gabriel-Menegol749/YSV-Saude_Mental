import { useState } from "react";
import "./FormacaoAcademica.css";

interface Props {
    usuario: any;
    modo: "visualizacao" | "edicao";
}

export default function FormacaoAcademica({ usuario, modo }: Props) {
    const [formacoes, setFormacoes] = useState([
        { curso: "Psicologia", instituicao: "UPF", inicio: "2022", conclusao: "2025", certificado: "", aindaCursando: false }
    ]);

    const [mostrarTodasFormacoes, setMostrarTodasFormacoes] = useState(false);

    const adicionarFormacao = () => {
        setFormacoes([
            ...formacoes,
            { curso: "", instituicao: "", inicio: "", conclusao: "", certificado: "", aindaCursando: false }
        ]);
    };

    const atualizarFormacao = (index: number, campo: string, valor: string | boolean) => {
        const novas = [...formacoes];
        (novas[index] as any)[campo] = valor;
        setFormacoes(novas);
    };

    const removerFormacao = (index: number) => {
        setFormacoes(formacoes.filter((_, i) => i !== index));
    };

    return (
        <div className="FormacaoAcademica">
            <h2>Formação Acadêmica</h2>
            <hr />

            {formacoes
                .slice(0, mostrarTodasFormacoes ? formacoes.length : 2)
                .map((form, i) => (
                    <div className="formacao" key={i}>
                        {modo === "edicao" ? (
                            <>
                                <div className="inputsFormacao">
                                    <input
                                        type="text"
                                        placeholder="Curso"
                                        value={form.curso}
                                        onChange={(e) =>
                                            atualizarFormacao(i, "curso", e.target.value)
                                        }
                                    />
                                    <input
                                        type="text"
                                        placeholder="Instituição de Formação"
                                        value={form.instituicao}
                                        onChange={(e) =>
                                            atualizarFormacao(i, "instituicao", e.target.value)
                                        }
                                    />
                                    <input
                                        type="text"
                                        placeholder="Data de Início"
                                        value={form.inicio}
                                        onChange={(e) =>
                                            atualizarFormacao(i, "inicio", e.target.value)
                                        }
                                    />
                                    <input
                                        type="text"
                                        placeholder="Data de Conclusão"
                                        value={form.conclusao}
                                        onChange={(e) =>
                                            atualizarFormacao(i, "conclusao", e.target.value)
                                        }
                                    />

                                    <label className="checkboxCursando">
                                        <input
                                            type="checkbox"
                                            checked={form.aindaCursando}
                                            onChange={(e) =>
                                                atualizarFormacao(i, "aindaCursando", e.target.checked)
                                            }
                                        />
                                        Ainda cursando
                                    </label>

                                    <div className="uploadCertificado">
                                        <label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const url = URL.createObjectURL(file);
                                                        atualizarFormacao(i, "certificado", url);
                                                    }
                                                }}
                                            />
                                            Enviar certificado
                                        </label>
                                        {form.certificado && (
                                            <img
                                                src={form.certificado}
                                                alt="Certificado"
                                                className="imgCertificadoPreview"
                                            />
                                        )}
                                    </div>

                                    <button
                                        onClick={() => removerFormacao(i)}
                                        className="removerFormacao"
                                    >
                                        Remover
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="infoCertificado">
                                {form.certificado && (
                                    <img
                                        src={form.certificado}
                                        alt="Certificado"
                                        className="imgCertificado"
                                    />
                                )}
                                <h3>{form.curso}</h3>
                                <p>{form.instituicao}</p>
                                <p>
                                    {form.aindaCursando
                                        ? "Cursando Atualmente"
                                        : `${form.inicio} - ${form.conclusao}`}
                                </p>
                            </div>
                        )}
                    </div>
                ))}

            {modo === "edicao" && (
                <button
                    onClick={adicionarFormacao}
                    className="botaoAdicionarFormacao"
                >
                    + Adicionar Formação
                </button>
            )}

            {formacoes.length > 2 && (
                <p
                    className="vermaisFormacao"
                    onClick={() =>
                        setMostrarTodasFormacoes(!mostrarTodasFormacoes)
                    }
                >
                    {mostrarTodasFormacoes ? "Ver menos..." : "Ver mais..."}
                </p>
            )}
        </div>
    );
}
