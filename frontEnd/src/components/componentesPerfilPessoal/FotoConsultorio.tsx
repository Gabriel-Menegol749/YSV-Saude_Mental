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
        if (arquivos) {
            const filesArray = Array.from(arquivos);
            
            filesArray.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewsTemporarios(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
            
            setIsUploading(true);
            const uploadPromises = filesArray.map((file) =>
                uploadImagem(file, 'consultorio')
            );

            try{
                const results = await Promise.all(uploadPromises);
                const novasFotosUrls = results.map(res => res.url);
                setFotos([...fotos, ...novasFotosUrls]);
                setPreviewsTemporarios([]);
            } catch(error){
                console.error("Falha no upload de uma ou mais fotos do consultório.", error);
                alert("Erro no fazer Upload de Imagens do consultório.");
                setPreviewsTemporarios([]);
            } finally {
                setIsUploading(false);
                e.target.value = '';
            }
        }
    };

    const removerFoto = (index: number) => {
        const fotosSalvasLength = fotos.length;

        if (index < fotosSalvasLength) {
            setFotos(fotos.filter((_, i) => i !== index));
        } else {
            const previewIndex = index - fotosSalvasLength;
            setPreviewsTemporarios(previewsTemporarios.filter((_, i) => i !== previewIndex));
        }
    };

    const fotosParaExibir = [
        ...fotos.map(url => ({ 
            src: `${API_BASE_URL}${url}`, 
            isTemp: false,
        })),
        ...previewsTemporarios.map(url => ({ 
            src: url, 
            isTemp: true,
        }))
    ];

    return (
        <div className="fotosConsultorioPresencial">
            <div className="tituloConsultorioPresencial">
                <h2>Consultório Presencial | {" "} </h2>
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
                        <div key={i} className={`imgContainerConsultorio ${foto.isTemp ? 'uploading' : ''}`}>
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
                    <label className="uploadLabel" style={{ opacity: isUploading ? 0.6 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}>
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