import { useState } from "react";
import "./FormacaoAcademica.css";
import { uploadImagem } from "../../services/api.ts";
const API_BASE_URL = 'http://localhost:5000'; // Assumindo que esta URL está correta

interface Formacao {
    curso: string;
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
}

export default function FormacaoAcademica({ usuario, modo, formacoes, setFormacoes, isMeuPerfil }: Props) {
    const [ mostrarTodasFormacoes, setMostrarTodasFormacoes] = useState(false);
    // [OK] ESTADO DE PREVIEW TEMPORÁRIO
    const [ previewsCertificado, setPreviewsCertificado ] = useState<{ [key:number]: string | null}>({});

    const adicionarFormacao = () => {
        setFormacoes([
            ...formacoes,
            { curso: "", instituicao: "", inicio: "", conclusao: "", certificado: "", aindaCursando: false }
        ]);
        // Adicionando a limpeza do preview ao adicionar nova formação (melhoria)
        setPreviewsCertificado({});
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
        // [OK] Removendo o preview associado
        const newPreviews = { ...previewsCertificado };
        delete newPreviews[index];
        setPreviewsCertificado(newPreviews);
    };

    return (
        <div className="FormacaoAcademica">
            <h2>Formação Acadêmica</h2>
            <hr />

            {formacoes
                .slice(0, mostrarTodasFormacoes ? formacoes.length : 2)
                .map((form, i) => {
                    // [OK] LÓGICA DE URL: Prioriza Data URL (preview) ou URL completa (salvo)
                    const certificadoParaExibir = previewsCertificado[i] || (form.certificado ? `${API_BASE_URL}${form.certificado}` : null);

                    return (
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
                                            type="date"
                                            placeholder="Data de Início"
                                            value={form.inicio}
                                            onChange={(e) =>
                                                atualizarFormacao(i, "inicio", e.target.value)
                                            }
                                        />
                                        <input
                                            type="date"
                                            placeholder="Data de Conclusão"
                                            value={form.conclusao}
                                            disabled={form.aindaCursando}
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
                                                    onChange={ async(e) => {
                                                        const file = e.target.files?.[0];
                                                        
                                                        if (file) {
                                                            // 1. CRIA O PREVIEW IMEDIATO (Data URL)
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setPreviewsCertificado(prev => ({
                                                                    ...prev,
                                                                    [i]: reader.result as string // Salva a Data URL no estado
                                                                }));
                                                            };
                                                            reader.readAsDataURL(file); // Lê o arquivo

                                                            // 2. FAZ O UPLOAD PARA O BACKEND
                                                            try{
                                                                const uploadResponse = await uploadImagem(file, 'consultorio');
                                                                atualizarFormacao(i, "certificado", uploadResponse.url); // Salva o caminho do backend
                                                                
                                                                // Limpa o preview temporário após sucesso (o form.certificado assume)
                                                                setPreviewsCertificado(prev => {
                                                                    const newPreviews = { ...prev };
                                                                    delete newPreviews[i]; 
                                                                    return newPreviews;
                                                                });
                                                            } catch(e){
                                                                console.error("Erro ao enviar o certificado: ", e);
                                                                alert("Falha no upload do certificado, tente novamente!");
                                                                // Remove o preview temporário em caso de erro
                                                                setPreviewsCertificado(prev => {
                                                                    const newPreviews = { ...prev };
                                                                    delete newPreviews[i];
                                                                    return newPreviews;
                                                                });
                                                            }
                                                        } else {
                                                            // Limpa se o usuário cancelar a seleção de arquivo
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
                                            
                                            {/* EXIBIÇÃO DO PREVIEW/IMAGEM SALVA */}
                                            {certificadoParaExibir && (
                                                <img
                                                    src={certificadoParaExibir} // Usa a URL completa (Data URL ou API_BASE_URL + path)
                                                    alt="Certificado"
                                                    className="imgCertificadoPreview"
                                                />
                                            )}
                                            {/* Botão para REMOVER o certificado atual */}
                                            {form.certificado && (
                                                <button 
                                                    onClick={() => atualizarFormacao(i, "certificado", "")}
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
                                            // [OK] CORREÇÃO: Concatena API_BASE_URL para visualização correta
                                            src={`${API_BASE_URL}${form.certificado}`} 
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