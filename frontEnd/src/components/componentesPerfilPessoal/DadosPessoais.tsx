import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DadosPessoais.css";
import fotoPerfil from "../../assets/profile-circle-svgrepo-com.svg";
import fotoAGENDAFUTURAMENTEDELETAR from "../../assets/fotAGENDADELETAR.png";
import fotoESTRELAFUTURAMENTEDELETAR from "../../assets/fotESTRELASDELETAR.png";
import iconeDeleteLixo from "../../assets/lixo-delete.png";
import configIcone from "../../assets/3pontsConfig.png";

interface Props {
    usuario: any;
    usuarioLogado?: any; // ✅ nova prop adicionada
    modo: "visualizacao" | "edicao";
    isPerfilPessoal?: boolean;
    onToggleEdicao?: () => void;
}

export default function DadosPessoais({
    usuario,
    usuarioLogado,
    modo,
    isPerfilPessoal = true,
    onToggleEdicao,
}: Props) {
    const [menuAberto, setMenuAberto] = useState(false);
    const [profissao, setProfissao] = useState(usuario.profissao || "Psicólogo");
    const [nome, setNome] = useState(usuario.nome || "Nome do Usuário");
    const [crp, setCrp] = useState(usuario.crp || "CRP 12/34567");
    const [atendimento, setAtendimento] = useState(usuario.atendimento || "On-line e Presencial");
    const [valorConsulta, setValorConsulta] = useState(usuario.valorConsulta || "150");
    const [duracaoConsulta, setDuracaoConsulta] = useState(usuario.duracaoConsulta || "50 minutos");
    const [especialidades, setEspecialidades] = useState<string[]>(usuario.especialidades || ["Depressão", "Ansiedade"]);
    const [modoEdicao, setModoEdicao] = useState(modo === "edicao");
    const menuRef = useRef<HTMLDivElement>(null);

    const navigate = useNavigate(); // ✅ adicionado

    const tipoUsuario = usuario.tipoUsuario || "Profissional";
    const isProfissional = tipoUsuario === "Profissional";

    useEffect(() => {
        setModoEdicao(modo === "edicao");
    }, [modo]);

    useEffect(() => {
        const handleClickFora = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuAberto(false);
            }
        };
        document.addEventListener("mousedown", handleClickFora);
        return () => document.removeEventListener("mousedown", handleClickFora);
    }, []);

    const toggleEdicao = () => {
        if (onToggleEdicao) onToggleEdicao();
        else setModoEdicao(!modoEdicao);
        setMenuAberto(false);
    };

    const adicionarEspecialidade = () => setEspecialidades([...especialidades, ""]);
    const atualizarEspecialidade = (index: number, value: string) => {
        const novas = [...especialidades];
        novas[index] = value;
        setEspecialidades(novas);
    };
    const removerEspecialidade = (index: number) =>
        setEspecialidades(especialidades.filter((_, i) => i !== index));

    return (
        <div className="perfilPessoal">
            <div className="PerfilCard">
                <img src={fotoPerfil} alt="Foto de perfil" className="fotoPerfilMeuPerfil" />
                <div className="infoUserPerfil">
                    {modoEdicao ? (
                        <>
                            <select
                                value={profissao}
                                onChange={(e) => setProfissao(e.target.value)}
                                className="selectProf"
                            >
                                <option className="opcaoProf">Psicólogo</option>
                                <option className="opcaoProf">Psiquiatra</option>
                            </select>
                            <div className="containerInfoEd">
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    placeholder="Nome do Usuário"
                                />
                                {isProfissional && (
                                    <input
                                        type="text"
                                        value={crp}
                                        onChange={(e) => setCrp(e.target.value)}
                                        placeholder="CRP"
                                    />
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <h2>{profissao}</h2>
                            <h1>{nome}</h1>
                            {isProfissional && <h2>{crp}</h2>}
                        </>
                    )}

                    <div className="estrelasAvaliacao">
                        {isProfissional && (
                            <img
                                src={fotoESTRELAFUTURAMENTEDELETAR}
                                alt="Avaliações"
                                className="estrelasimg"
                            />
                        )}
                    </div>

                    <div className="botaoConfigPerfil" ref={menuRef}>
                        <img
                            src={configIcone}
                            alt="Configurações"
                            className="iconeConfig"
                            onClick={() => setMenuAberto(!menuAberto)}
                        />
                        {menuAberto && (
                            <div className="menuConfigPerfil">
                                {isPerfilPessoal ? (
                                    <button onClick={toggleEdicao}>
                                        {modoEdicao ? "Salvar alterações" : "Editar Perfil"}
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={() => alert("Perfil salvo!")}>
                                            Salvar Perfil
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(window.location.href);
                                                alert("Link do perfil copiado!");
                                            }}
                                        >
                                            Compartilhar Perfil
                                        </button>
                                        <button onClick={() => alert("Denúncia enviada!")}>
                                            Denunciar Perfil
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="infoUsuario">
                <div className="DadosUsuario">
                    <div className="InfoAtendimentos">
                        <h2>Atendimento: </h2>
                        {modoEdicao ? (
                            <select value={atendimento} onChange={(e) => setAtendimento(e.target.value)}>
                                <option>On-Line e Presencial</option>
                                <option>On-Line</option>
                                <option>Presencial</option>
                            </select>
                        ) : (
                            <span>{atendimento}</span>
                        )}

                        <h2>Valor Consulta:</h2>
                        {modoEdicao ? (
                            <input
                                type="number"
                                value={valorConsulta}
                                onChange={(e) => setValorConsulta(e.target.value)}
                            />
                        ) : (
                            <span>R$ {valorConsulta}</span>
                        )}

                        <h2>Duração da Consulta:</h2>
                        {modoEdicao ? (
                            <input
                                type="number"
                                value={duracaoConsulta.replace(/[^0-9]/g, "")}
                                onChange={(e) => setDuracaoConsulta(e.target.value)}
                                placeholder="Minutos"
                            />
                        ) : (
                            <span>{duracaoConsulta.replace(/[^0-9]/g, "")} minutos</span>
                        )}

                        <h2>Especialidades:</h2>
                        <div className="CardsEspecialidades">
                            {especialidades.map((esp, i) =>
                                modoEdicao ? (
                                    <div key={i} className="especialidadeEditavel">
                                        <div className="containerInputEspecialidade">
                                            <input
                                                className="inputEspecialidades"
                                                type="text"
                                                value={esp}
                                                onChange={(e) => atualizarEspecialidade(i, e.target.value)}
                                            />
                                            <button
                                                onClick={() => removerEspecialidade(i)}
                                                className="botaoIconeLixo"
                                            >
                                                <img
                                                    src={iconeDeleteLixo}
                                                    alt=""
                                                    className="iconeDeleteLixo"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="especialidade" key={i}>
                                        {esp}
                                    </p>
                                )
                            )}
                        </div>
                        {modoEdicao && (
                            <button
                                onClick={adicionarEspecialidade}
                                className="adicionarEspecialidade"
                            >
                                Adicionar Especialidade
                            </button>
                        )}
                    </div>

                    {/* ✅ botão só aparece se não for modo edição e não for o dono */}
                    {!modoEdicao && usuarioLogado?._id !== usuario?._id && (
                        <button
                            className="envieMensagem"
                            onClick={() => navigate(`/chat/${usuario?._id}`)}
                        >
                            Envie uma Mensagem!
                        </button>
                    )}
                </div>

                <div className="Agenda">
                    <img
                        src={fotoAGENDAFUTURAMENTEDELETAR}
                        alt="Agenda"
                        className="agendaFOTO"
                    />
                </div>
            </div>
        </div>
    );
}
