import { useState } from "react";
import './SobreMim.css'
interface Props {
    usuario: any;
    modo: "visualizacao" | "edicao";
}

export default function SobreMim({ usuario, modo }: Props) {
    const [videoSobreMim, setVideoSobreMim] = useState<string>(usuario.videoSobreMim || "");
    const [textoSobreMim, setTextoSobreMim] = useState<string>(usuario.textoSobreMim || "");

    const modoEdicao = modo === "edicao";
    const tipoUsuario = usuario.tipoUsuario || "Profissional";
    const nomeUsuario = usuario.nome || "Nome do Usuário";

    return (
        <>
            {(videoSobreMim || textoSobreMim || modoEdicao) && (
                <div className="SobreMim">
                    <h2>Sobre {tipoUsuario === "Profissional" ? nomeUsuario : "o cliente"}</h2>
                    <hr />

                    <div className="conteudoSobreMim">
                        {/* --- VÍDEO --- */}
                        <div className="videoResumo">
                            {modoEdicao ? (
                                <>
                                    {videoSobreMim ? (
                                        <div className="videoContainer">
                                            <video src={videoSobreMim} controls width="250" />
                                            <div className="botoesVideo">
                                                <button onClick={() => setVideoSobreMim("")}>Remover</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="upLoadDoVideo">
                                            <input
                                                type="file"
                                                accept="video/mp4"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const url = URL.createObjectURL(file);
                                                        setVideoSobreMim(url);
                                                    }
                                                }}
                                            />
                                            <span>+ Adicione um vídeo (.mp4)</span>
                                        </label>
                                    )}
                                </>
                            ) : (
                                videoSobreMim && <video src={videoSobreMim} controls width="300" />
                            )}
                        </div>

                        {/* --- TEXTO --- */}
                        <div className="textoSobreMim">
                            {modoEdicao ? (
                                <>
                                    <textarea
                                        placeholder="Adicione um resumo sobre você e sua carreira!"
                                        value={textoSobreMim}
                                        onChange={(e) => setTextoSobreMim(e.target.value)}
                                    />
                                    {textoSobreMim && (
                                        <button onClick={() => setTextoSobreMim("")}>
                                            Remover texto
                                        </button>
                                    )}
                                </>
                            ) : (
                                textoSobreMim && <p>{textoSobreMim}</p>
                            )}
                        </div>
                    </div>

                    {!modoEdicao && <p className="Vermais">Ver mais...</p>}
                </div>
            )}
        </>
    );
}
