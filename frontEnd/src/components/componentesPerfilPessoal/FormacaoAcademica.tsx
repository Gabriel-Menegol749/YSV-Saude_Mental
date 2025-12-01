import { useState } from "react";
import "./FormacaoAcademica.css";
import { uploadImagem } from "../../services/api.ts";

const API_BASE_URL = 'http://localhost:5000';

interface Formacao {
    nome: string;
    instituicao: string;
    inicio: string;
    conclusao: string;
    certificado: string;
    aindaCursando: boolean;
}

interface Props {
    usuario: any;
    modo: "visualizacao" | "edicao";
    formacoes: Formacao[];
    setFormacoes: (novasFormacoes: Formacao[]) => void;
    isMeuPerfil: boolean;
    onSave?: () => Promise<void>;
}

export default function FormacaoAcademica({ 
    modo, 
    formacoes, 
    setFormacoes, 
}: Props) {
    const [ mostrarTodasFormacoes, setMostrarTodasFormacoes] = useState(false);
    const [ previewsCertificado, setPreviewsCertificado ] = useState<{ [key:number]: string | null}>({});

    const adicionarFormacao = () => {
        setFormacoes([
            ...formacoes,
            { nome: "", instituicao: "", inicio: "", conclusao: "", certificado: "", aindaCursando: false }
        ]);
    };

    const atualizarFormacao = (index: number, campo: string, valor: string | boolean) => {
        const novas = [...formacoes];
        (novas[index] as any)[campo] = valor;

        if (campo === "aindaCursando" && valor === true) {
            novas[index].conclusao = "";
        }

        setFormacoes(novas);
    };

    const removerFormacao = (index: number) => {
        setFormacoes(formacoes.filter((_, i) => i !== index));

        const newPreviews = { ...previewsCertificado };
        delete newPreviews[index];
        setPreviewsCertificado(newPreviews);
    };

    const getCertificadoUrl = (certificado: string): string => {
        if (!certificado) return '';
        if (certificado.startsWith('http')) return certificado;
        return `${API_BASE_URL}${certificado.startsWith('/') ? certificado : '/' + certificado}`;
    };

    return (
        <div className="FormacaoAcademica">
            <h2>Formação Acadêmica</h2>
            <hr />

            {formacoes
                .slice(0, mostrarTodasFormacoes ? formacoes.length : 2)
                .map((form, i) => {
                    const certificadoParaExibir = previewsCertificado[i] || 
                        (form.certificado ? getCertificadoUrl(form.certificado) : null);

                    return (
                        <div className="formacao" key={i}>
                            {modo === "edicao" ? (
                                <>
                                    <div className="inputsFormacao">
                                        <input
                                            type="text"
                                            placeholder="Curso"
                                            value={form.nome}
                                            onChange={(e) => atualizarFormacao(i, "nome", e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Instituição de Formação"
                                            value={form.instituicao}
                                            onChange={(e) => atualizarFormacao(i, "instituicao", e.target.value)}
                                        />
                                        <input
                                            type="date"
                                            placeholder="Data de Início"
                                            value={form.inicio}
                                            onChange={(e) => atualizarFormacao(i, "inicio", e.target.value)}
                                        />
                                        <input
                                            type="date"
                                            placeholder="Data de Conclusão"
                                            value={form.conclusao}
                                            disabled={form.aindaCursando}
                                            onChange={(e) => atualizarFormacao(i, "conclusao", e.target.value)}
                                        />
                                        <label className="checkboxCursando">
                                            <input
                                                type="checkbox"
                                                checked={form.aindaCursando}
                                                onChange={(e) => atualizarFormacao(i, "aindaCursando", e.target.checked)}
                                            />
                                            Ainda cursando
                                        </label>

                                        <div className="uploadCertificado">
                                            <label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];

                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setPreviewsCertificado(prev => ({
                                                                    ...prev,
                                                                    [i]: reader.result as string
                                                                }));
                                                            };
                                                            reader.readAsDataURL(file);

                                                            try {
                                                                const uploadResponse = await uploadImagem(file, 'consultorio');
                                                                const urlCertificado = Array.isArray(uploadResponse.url)
                                                                ? uploadResponse.url[0]
                                                                : uploadResponse.url;
                                                                atualizarFormacao(i, "certificado", urlCertificado || '');

                                                                setPreviewsCertificado(prev => {
                                                                    const newPreviews = { ...prev };
                                                                    delete newPreviews[i];
                                                                    return newPreviews;
                                                                });
                                                            } catch (e) {
                                                                console.error("Erro ao enviar o certificado: ", e);
                                                                alert("Falha no upload do certificado, tente novamente!");

                                                                setPreviewsCertificado(prev => {
                                                                    const newPreviews = { ...prev };
                                                                    delete newPreviews[i];
                                                                    return newPreviews;
                                                                });
                                                            }
                                                        } else {
                                                            atualizarFormacao(i, "certificado", "");
                                                            setPreviewsCertificado(prev => {
                                                                const newPreviews = { ...prev };
                                                                delete newPreviews[i];
                                                                return newPreviews;
                                                            });
                                                        }
                                                    }}
                                                />
                                                Enviar certificado
                                            </label>

                                            {certificadoParaExibir && (
                                                <img
                                                    src={certificadoParaExibir}
                                                    alt="Certificado"
                                                    className="imgCertificadoPreview"
                                                />
                                            )}

                                            {form.certificado && (
                                                <button
                                                    onClick={() => {
                                                        atualizarFormacao(i, "certificado", "");
                                                        setPreviewsCertificado(prev => {
                                                            const newPreviews = { ...prev };
                                                            delete newPreviews[i];
                                                            return newPreviews;
                                                        });
                                                    }}
                                                    className="removerCertificadoBtn"
                                                >
                                                    Remover Certificado
                                                </button>
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
                                            src={getCertificadoUrl(form.certificado)}
                                            alt="Certificado"
                                            className="imgCertificado"
                                        />
                                    )}
                                    <h3>{form.nome}</h3>
                                    <p>{form.instituicao}</p>
                                    <p>
                                        {form.aindaCursando
                                            ? "Cursando Atualmente"
                                            : `${form.inicio} - ${form.conclusao}`}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}

            {modo === "edicao" && (
                <button
                    onClick={adicionarFormacao}
                    className="botaoAdicionarFormacao"
                >
                    Adicionar Formação
                </button>
            )}

            {formacoes.length > 2 && (
                <p
                    className="vermaisFormacao"
                    onClick={() => setMostrarTodasFormacoes(!mostrarTodasFormacoes)}
                >
                    {mostrarTodasFormacoes ? "Ver menos..." : "Ver mais..."}
                </p>
            )}
        </div>
    );
}
