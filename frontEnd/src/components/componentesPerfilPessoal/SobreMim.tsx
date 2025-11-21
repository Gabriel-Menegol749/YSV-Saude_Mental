import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import "./SobreMim.css";

interface PerfilCompleto {
    _id?: string;
    fotoPerfil?: string;
    tipoUsuario: 'Cliente' | 'Profissional';
    nome: string;
}

interface Props {
  usuario: PerfilCompleto;
  modo: "visualizacao" | "edicao";
  isMeuPerfil: boolean;

  textoSobreMim: string;
  setTextoSobreMim: (v: string) => void;
  videoSobreMim: string | null;

  setNovoVideoSobreMimFile: (f: File | null) => void;

  removerVideoSobreMim: boolean;
  setRemoverVideoSobreMim: Dispatch<SetStateAction<boolean>>;
}

export default function SobreMim({
  usuario,
  modo,
  isMeuPerfil,
  textoSobreMim,
  setTextoSobreMim,
  videoSobreMim,
  setNovoVideoSobreMimFile,
  removerVideoSobreMim,
  setRemoverVideoSobreMim,
}: Props) {
    const modoEdicao = modo === "edicao";
    const [ localPreviewUrl, setLocalPreviewUrl ] = useState<string | null>(null);

    const [isExpandido, setIsExpandido] = useState(false);
    const [showVerMais, setShowVerMais] = useState(false);

    const textoRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      if (localPreviewUrl) {
            URL.revokeObjectURL(localPreviewUrl);
        }

      setNovoVideoSobreMimFile(file);

      const newUrl = file ? URL.createObjectURL(file) : null;
      setLocalPreviewUrl(newUrl);
    };

    const videoSource = removerVideoSobreMim ? null : (localPreviewUrl || videoSobreMim || null);
    const handleRemoverVideo = async () => {
      if (!isMeuPerfil) return;

      if (localPreviewUrl) {
            URL.revokeObjectURL(localPreviewUrl);
            setLocalPreviewUrl(null);
        }
        setNovoVideoSobreMimFile(null);
        if(videoSobreMim){
          setRemoverVideoSobreMim(true);
        }
    };

    const handleRemoverTexto = () => {
      setTextoSobreMim("");
    };

    useEffect(() => {
        return () => {
            if (localPreviewUrl) {
                URL.revokeObjectURL(localPreviewUrl);
            }
        };
    }, [localPreviewUrl]);

    useEffect(() => {
      if (!modoEdicao && textoRef.current) {
        const needsMore =
          textoRef.current.scrollHeight > textoRef.current.clientHeight;
        setShowVerMais(needsMore);
      }
    }, [textoSobreMim, modoEdicao]);


    if (!textoSobreMim && !videoSource && !modoEdicao) return null;

    return (
      <div className="SobreMim">
        <h2>Sobre {usuario.nome}</h2>
        <hr />

        <div className="conteudoSobreMim">
          {/* --- VÍDEO --- */}
          <div className="videoResumo">
            {modoEdicao ? (
              <>
                {videoSource ? (
                  <div className="videoContainer">
                    <video
                      key={videoSource}
                      src={videoSource}
                      controls
                      className="displayVideoUsuario"
                    />
                  </div>
                ) : (
                  <label className="upLoadDoVideo">
                    <input
                      type="file"
                      accept="video/mp4"
                      onChange={handleVideoChange}
                    />
                    <span>+ Adicione um vídeo (.mp4)</span>
                  </label>
                )}
              </>
            ) : (
              videoSource && <video key={videoSource} src={videoSource} controls />
            )}
          </div>

          {/* --- TEXTO --- */}
          <div className="containerTexto">
            <div className="textoSobreMim">
              {modoEdicao ? (
                <textarea
                  placeholder="Adicione um resumo sobre você!"
                  value={textoSobreMim}
                  onChange={(e) => setTextoSobreMim(e.target.value)}
                  rows={8}
                />
              ) : textoSobreMim ? (
                <div
                  className={`textoDescricao ${isExpandido ? "expandido" : "colapsado"}`}
                  ref={containerRef}
                >
                  <p ref={textoRef}>{textoSobreMim}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* --- BOTÕES DE REMOÇÃO --- */}
        {modoEdicao && (
          <div className="botoesGeraisEdicao">
            {textoSobreMim && (
              <button className="botaoEdicao" onClick={handleRemoverTexto}>
                Remover texto
              </button>
            )}
            {videoSource && (
              <button className="botaoEdicao" onClick={handleRemoverVideo}>
                Remover vídeo
              </button>
            )}
          </div>
        )}

        {/* VER MAIS */}
        {showVerMais && !modoEdicao && (
          <div className="containervermaisAv">
            <p
              className="vermaiavaliacao"
              onClick={() => {
                setIsExpandido(!isExpandido);
                if (isExpandido && containerRef.current) {
                  containerRef.current.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              {isExpandido ? "Ver menos..." : "Ver mais..."}
            </p>
          </div>
        )}
      </div>
    );
  }
