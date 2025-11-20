import { uploadImagem } from "../../services/api.ts";
import "./FotoConsultorio.css";

interface Props {
    usuario: any;
    modo: "visualizacao" | "edicao";
    nomeConsultorio: string;
    fotos: string[];
    setNomeConsultorio: (valor: string) => void;
    setFotos: (novasFotos: string[]) => void;
    isMeuPerfil: boolean;
    onSave: (dados: any) => Promise<void>;
}

export default function FotoConsultorio({
    usuario,
    modo,
    nomeConsultorio,
    fotos,
    setNomeConsultorio,
    setFotos,
    isMeuPerfil,
    onSave
}: Props) {
    const handleUploadFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const arquivos = e.target.files;
        if (arquivos) {
            const uploadPromises = Array.from(arquivos).map((file) =>
                uploadImagem(file, 'consultorio')
            );
            try{
                const results = await Promise.all(uploadPromises);
                const novasFotosUrls = results.map(res => res.url);
                setFotos([...fotos, ...novasFotosUrls]);
            } catch(error){
                console.error("Falha no upload de uma ou mais fotos do consultório.", error);
                alert("Erro no fazer Upload de Imagens do consultório.");
            }
        }
    };

    const removerFoto = (index: number) => {
        setFotos(fotos.filter((_, i) => i !== index));
    };

    return (
        <div className="fotosConsultorioPresencial">
            <h2>
                Consultório Presencial{" "}
                {modo === "edicao" ? (
                    <input
                        type="text"
                        value={nomeConsultorio}
                        onChange={(e) => setNomeConsultorio(e.target.value)}
                        placeholder="Nome do consultório"
                        className="inputNomeConsultorio"
                    />
                ) : (
                    `| ${nomeConsultorio}`
                )}
            </h2>

            <hr />

            <div className="imagensClicaveisConsultorio">
                {fotos.length > 0 ? (
                    fotos.map((foto, i) => (
                        <div key={i} className="imgContainerConsultorio">
                            <img
                                src={foto}
                                alt={`Consultório ${i + 1}`}
                                className="imgConsultorio"
                            />
                            {modo === "edicao" && (
                                <button
                                    className="removerFoto"
                                    onClick={() => removerFoto(i)}
                                >
                                    Remover
                                </button>
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
                    <label className="uploadLabel">
                        + Adicionar fotos
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleUploadFotos}
                        />
                    </label>
                </div>
            )}
        </div>
    );
}