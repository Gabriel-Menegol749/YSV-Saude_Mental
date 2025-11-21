import { useState } from "react";
import { uploadImagem } from "../../services/api.ts";
import "./FotoConsultorio.css";

const API_BASE_URL = 'http://localhost:5000';

interface Props {
    usuario: any;
    modo: "visualizacao" | "edicao";
    enderecoConsultorio: string;
    fotos: string[];
    setEnderecoConsultorio: (valor: string) => void;
    setFotos: (novasFotos: string[]) => void;
    isMeuPerfil: boolean;
    onSave?: () => Promise<void>;
}

export default function FotoConsultorio({
    usuario,
    modo,
    enderecoConsultorio,
    fotos,
    setEnderecoConsultorio,
    setFotos,
    isMeuPerfil,
    onSave
}: Props) {
    const [previewsTemporarios, setPreviewsTemporarios] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleUploadFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const arquivos = e.target.files;
        if (!arquivos || arquivos.length === 0) return;

        const filesArray = Array.from(arquivos);

        // Cria previews locais imediatamente
        const previewsLocais: string[] = [];
        filesArray.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                previewsLocais.push(reader.result as string);
                if (previewsLocais.length === filesArray.length) {
                    setPreviewsTemporarios(prev => [...prev, ...previewsLocais]);
                }
            };
            reader.readAsDataURL(file);
        });

        setIsUploading(true);

        try {
            const uploadPromises = filesArray.map(file => uploadImagem(file, 'consultorio'));
            const results = await Promise.all(uploadPromises);

            // ✅ Achata os arrays
            const novasFotosUrls: string[] = [];

            results.forEach(res => {
                if (Array.isArray(res.url)) {
                    res.url.forEach(u => {
                        if (typeof u === 'string') {
                            novasFotosUrls.push(u);
                        }
                    });
                } else if (typeof res.url === 'string') {
                    novasFotosUrls.push(res.url);
                }
            });

            const novasFotos = [...(fotos || []), ...novasFotosUrls];

            console.log("🆕 URLs de fotos recebidas do backend:", novasFotosUrls);
            console.log("📷 Fotos novas (enviadas pro PerfilPessoal):", novasFotos);

            setFotos(novasFotos);
            setPreviewsTemporarios([]);
        } catch (error) {
            console.error("Falha no upload de uma ou mais fotos do consultório.", error);
            alert("Erro ao fazer Upload de Imagens do consultório.");
            setPreviewsTemporarios([]);
        } finally {
            // ✅ CORREÇÃO: Sempre desliga o loading
            setIsUploading(false);
            e.target.value = ''; // Limpa o input
        }
    };

    const removerFoto = (index: number) => {
        const fotosSalvasLength = fotos.length;

        if (index < fotosSalvasLength) {
            const novasFotos = fotos.filter((_, i) => i !== index);
            setFotos(novasFotos);
        } else {
            const previewIndex = index - fotosSalvasLength;
            setPreviewsTemporarios(prev => prev.filter((_, i) => i !== previewIndex));
        }
    };

    const fotosParaExibir = [
        ...(fotos || [])
            .filter(url => url && typeof url === "string" && url.trim() !== "")
            .map(url => {
                const src = url.startsWith("http")
                    ? url
                    : `${API_BASE_URL}${url.startsWith("/") ? url : "/" + url}`;

                return {
                    src,
                    isTemp: false,
                };
            }),
        ...previewsTemporarios.map(url => ({
            src: url,
            isTemp: true,
        })),
    ];

    return (
        <div className="fotosConsultorioPresencial">
            <div className="tituloConsultorioPresencial">
                <h2>Consultório Presencial |{" "}</h2>
                {modo === "edicao" ? (
                    <input
                        type="text"
                        value={enderecoConsultorio}
                        onChange={(e) => setEnderecoConsultorio(e.target.value)}
                        placeholder="Endereço completo do consultório"
                        className="inputEnderecoConsultorio"
                    />
                ) : (
                    `| ${enderecoConsultorio}`
                )}
            </div>
            <hr />

            <div className="imagensClicaveisConsultorio">
                {fotosParaExibir.length > 0 ? (
                    fotosParaExibir.map((foto, i) => (
                        <div
                            key={i}
                            className={`imgContainerConsultorio ${foto.isTemp ? "uploading" : ""}`}
                        >
                            <img
                                src={foto.src}
                                alt={`Consultório ${i + 1}`}
                                className="imgConsultorio"
                            />

                            {modo === "edicao" && (
                                <button
                                    className="removerFoto"
                                    onClick={() => removerFoto(i)}
                                    disabled={foto.isTemp && isUploading}
                                >
                                    Remover
                                </button>
                            )}

                            {foto.isTemp && isUploading && (
                                <div className="loadingOverlay">Carregando...</div>
                            )}
                        </div>
                    ))
                ) : (
                    modo === "visualizacao" && (
                        <p className="semFotos">Nenhuma foto disponível.</p>
                    )
                )}
            </div>

            {modo === "edicao" && (
                <div className="uploadContainer">
                    <label
                        className="uploadLabel"
                        style={{
                            opacity: isUploading ? 0.6 : 1,
                            cursor: isUploading ? "not-allowed" : "pointer",
                        }}
                    >
                        + Adicionar fotos
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleUploadFotos}
                            disabled={isUploading}
                        />
                    </label>
                    {isUploading && <p>Fazendo upload...</p>}
                </div>
            )}
        </div>
    );
}
