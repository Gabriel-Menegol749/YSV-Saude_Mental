import './SobreMim.css'

interface Props {
    usuario: any;
    modo: "visualizacao" | "edicao";
    // Novos campos (dados e funções) passados pelo pai
    textoSobreMim: string;
    videoSobreMim: string;
    setTextoSobreMim: (valor: string) => void;
    setVideoSobreMim: (valor: string) => void;
    isMeuPerfil: boolean;
    onSave: (dados: any) => Promise<void>;
}

export default function SobreMim({
    usuario,
    modo,
    textoSobreMim,
    videoSobreMim,
    setTextoSobreMim,
    setVideoSobreMim,
    isMeuPerfil,
    onSave
}: Props) {

    const modoEdicao = modo === "edicao";
    const tipoUsuario = usuario.tipoUsuario || "Profissional";
    const nomeUsuario = usuario.nome || "Nome do Usuário";

    return (
        <>
            {/* A seção aparecerá se houver conteúdo OU se estiver no modo de edição */}
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
                                                {/* Atualiza o estado no pai, definindo como string vazia */}
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
                                                        setVideoSobreMim(url); // Usa a prop setVideoSobreMim
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
                                        onChange={(e) => setTextoSobreMim(e.target.value)} // Usa a prop setTextoSobreMim
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