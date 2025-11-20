import { useEffect, useRef, useState } from "react";
import "./SobreMim.css";

interface PerfilCompleto {
  _id: string;
  nome: string;
  tipoUsuario: "Cliente" | "Profissional";
  infoCliente?: {
    resumoPessoal?: string;
  };
  infoProfissional?: {
    descricao?: string;
  };
}

interface Props {
  usuario: PerfilCompleto;
  modo: "visualizacao" | "edicao";
  onSave: (update: any) => Promise<void>;
  isMeuPerfil: boolean;

  textoSobreMim: string;
  setTextoSobreMim: (v: string) => void;
  videoSobreMim: string;
  setNovoVideoSobreMimFile: (f: File | null) => void;
}

export default function SobreMim({
  usuario,
  modo,
  onSave,
  isMeuPerfil,
  textoSobreMim,
  setTextoSobreMim,
  videoSobreMim,
  setNovoVideoSobreMimFile,
}: Props) {
  const modoEdicao = modo === "edicao";

  const [novoVideoPreview, setNovoVideoPreview] = useState<string | null>(null);
  const [novoVideoFile, setNovoVideoFile] = useState<File | null>(null);

  const [isExpandido, setIsExpandido] = useState(false);
  const [showVerMais, setShowVerMais] = useState(false);

  const textoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setNovoVideoFile(file);
    setNovoVideoSobreMimFile(file);
    setNovoVideoPreview(file ? URL.createObjectURL(file) : null);
  };

  const videoSource = novoVideoPreview || videoSobreMim || null;

  const handleSalvar = async () => {
    try {
      let videoUrl = videoSobreMim;

      if (novoVideoFile) {
        const formData = new FormData();
        formData.append("file", novoVideoFile);
        formData.append("tipo", "perfil");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        videoUrl = data.url;
      }

      await onSave({
        textoSobreMim,
        videoSobreMim: videoUrl,
      });

      setNovoVideoFile(null);
      setNovoVideoPreview(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar informações.");
    }
  };

  const handleRemoverVideo = async () => {
    if (!isMeuPerfil) return;

    setNovoVideoPreview(null);
    setNovoVideoSobreMimFile(null);

    await onSave({ removerVideoSobreMim: true });
  };

  const handleRemoverTexto = () => {
    setTextoSobreMim("");
  };

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
