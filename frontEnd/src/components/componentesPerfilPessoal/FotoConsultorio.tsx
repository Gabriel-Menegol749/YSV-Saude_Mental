import { useState } from "react";
import "./FotoConsultorio.css";

interface Props {
    usuario: any;
    modo: "visualizacao" | "edicao";
}

export default function FotoConsultorio({ usuario, modo }: Props) {
    const [nomeConsultorio, setNomeConsultorio] = useState("Clínica Ser & Mente");
    const [fotos, setFotos] = useState<string[]>([]);

    const handleUploadFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
        const arquivos = e.target.files;
        if (arquivos) {
            const novasFotos = Array.from(arquivos).map((file) =>
                URL.createObjectURL(file)
            );
            setFotos([...fotos, ...novasFotos]);
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
