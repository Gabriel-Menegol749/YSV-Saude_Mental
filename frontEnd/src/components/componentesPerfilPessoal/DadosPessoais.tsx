import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contextos/ContextoAutenticacao";

//Imports de icones
import fotoPerfilPadrao from "../../assets/profile-circle-svgrepo-com.svg";
import fotoESTRELAFUTURAMENTEDELETAR from "../../assets/fotESTRELASDELETAR.png";
import iconeCamera from "../../assets/camera.png";
import iconeDeleteLixo from "../../assets/lixo-delete.png";
import configIcone from "../../assets/3pontsConfig.png";

import "./DadosPessoais.css";
import Agenda from "../Agenda";

interface PerfilCompleto {
    _id?: string;
    fotoPerfil?: string;
    tipoUsuario: 'Cliente' | 'Profissional';
}
interface Props {
    usuario: PerfilCompleto | any;
    modo: "visualizacao" | "edicao";
    isMeuPerfil: boolean;
    onSave: () => Promise<void>;
    onToggleEdicao: () => void;

    //props para foto de perfil
    previewFotoUrl?: string | null;
    setNovaFotoPerfilFile: (file: File | null) => void;
    setPreviewFotoUrl: (url?: string | null) => void;

    //Campos editáveis
    nome: string; setNome: (valor: string) => void;
    profissao: string; setProfissao: (valor: string) => void;
    crp: string; setCrp: (valor: string) => void;
    modalidadeDeAtendimento: string; setAtendimento: (valor: string) => void;
    valorConsulta: string; setValorConsulta: (valor: string) => void;
    duracaoConsulta: string; setDuracaoConsulta: (valor: string) => void;
    especialidades: string[]; setEspecialidades: (valores: string[]) => void;
}

export default function DadosPessoais({
    usuario,
    modo,
    isMeuPerfil = false,
    onToggleEdicao,
    onSave,
    previewFotoUrl,
    setNovaFotoPerfilFile,
    setPreviewFotoUrl,
    nome, setNome,
    profissao, setProfissao,
    crp, setCrp,
    modalidadeDeAtendimento, setAtendimento,
    valorConsulta, setValorConsulta,
    duracaoConsulta, setDuracaoConsulta,
    especialidades, setEspecialidades,
}: Props) {
    const [menuAberto, setMenuAberto] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const modoEdicao = modo === "edicao";
    const tipoUsuario = usuario?.tipoUsuario || "Profissional";
    const isProfissional = tipoUsuario === "Profissional";

    const { logout, usuario: usuarioLogado } = useAuth();

    //efeito para fechar o menu de opções quando clica fora
    useEffect(() => {
        const handleClickFora = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuAberto(false);
            }
        };
        document.addEventListener("mousedown", handleClickFora);
        return () => document.removeEventListener("mousedown", handleClickFora);
    }, []);

    //Essa constante, salva as alterações do sistema
    const handleMenuAction = async () => {
        if(modoEdicao){
            await onSave();
            onToggleEdicao();
        } else {
            onToggleEdicao();
        }
        setMenuAberto(false);
    }

    //Constante para trocar de conta
    const handlerTrocarConta = () => {
        logout();
        setMenuAberto(false);
        navigate('/Autenticacao?modo=login');
    }

    const handleLogout = () => {
        logout();
        setMenuAberto(false);
        navigate('/');
    }

    const handleCopiarLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("A URL do perfil foi copiada!");
        setMenuAberto(false);
    }
    //esse daqui, quando clica na imagem do perfil, ele troca a foto do perfil
    const handleFotoClick = () => {
        if (modoEdicao && isMeuPerfil && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    //Essa constante, faz com que mudemos o foto de perfil
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        if (file) {
            setNovaFotoPerfilFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result;
                if (typeof result === 'string') {
                    setPreviewFotoUrl(result);
                } else {
                    setPreviewFotoUrl(null);
                }
            };
            reader.readAsDataURL(file);
        } else {
            setNovaFotoPerfilFile(null);
            setPreviewFotoUrl(undefined);
        }
    };
    
    const fotoExibida = previewFotoUrl
    ? previewFotoUrl
    : (usuario.fotoPerfil ? usuario.fotoPerfil : fotoPerfilPadrao);

    //Adicionar e remover especialidades
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
                {isMeuPerfil && (
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept="image/jpeg, image/png, image/webp"
                        className="inputAdicionarFotoPerfilNova"
                    />
                )}
                <div className={`containerFotoPerfil ${modoEdicao && isMeuPerfil ? 'edicao-ativa' : ''}`} onClick={handleFotoClick}>
                    <img src={fotoExibida} alt="fotoPerfil" className={`fotoPerfilMeuPerfil ${modoEdicao && isMeuPerfil ? 'clicavel' : ''}`} />
                    {modoEdicao && isMeuPerfil && (
                        <div className="overlay-edicao">
                            <img src={iconeCamera} alt="" className="iconeCamera" />
                        </div>
                    )}
                </div>

                <div className="infoUserPerfil">
                    {modoEdicao ? (
                        <>
                            {isProfissional && (
                                <select
                                    value={profissao || ""}
                                    onChange={(e) => setProfissao(e.target.value)}
                                    className="selectProf"
                                >
                                    <option value="" disabled hidden>Selecione a Profissão</option>
                                    <option value="Psicólogo" className="opcaoProf">Psicólogo</option>
                                    <option value="Psiquiatra" className="opcaoProf">Psiquiatra</option>
                                </select>
                            )}

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
                            { isProfissional && <h2>{profissao}</h2>}
                            <h1>{nome}</h1>
                            {isProfissional && <h2>{crp}</h2>}
                            <img className="estrelasimg" src={fotoESTRELAFUTURAMENTEDELETAR} alt="" />
                        </>
                    )}
                    <div className="botaoConfigPerfil" ref={menuRef}>
                        <img
                            src={configIcone}
                            alt="Configurações"
                            className="iconeConfig"
                            onClick={() => setMenuAberto(!menuAberto)}
                        />
                        {menuAberto && isMeuPerfil && (
                            <div className="menuConfigPerfil">
                                <button onClick={handleMenuAction}>
                                    {modoEdicao ? "Salvar alterações" : "Editar Perfil"}
                                </button>
                                <button className="trocarDConta" onClick={handlerTrocarConta}>Trocar de Conta</button>
                                <button className="sairConta" onClick={handleLogout}>Sair</button>
                            </div>
                        )}
                        {menuAberto && !isMeuPerfil && (
                            <div className="menuConfigPerfil">
                                <button onClick={() => alert("Perfil salvo!")}>Salvar Perfil</button>
                                <button onClick={(handleCopiarLink)}>Compartilhar Perfil</button>
                                <button onClick={() => alert("Denúncia enviada!")}>Denunciar Perfil</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="infoUsuario">
                <div className="DadosUsuario">
                    <div className="InfoAtendimentos">
                        <h2>{isProfissional ? "Atendimento: " : "Preferencia de Atendimento: "}</h2>
                        {modoEdicao ? (
                            <select value={modalidadeDeAtendimento} onChange={(e) => setAtendimento(e.target.value)}>
                                <option>On-Line e Presencial</option>
                                <option>On-Line</option>
                                <option>Presencial</option>
                            </select>
                            ): (
                            <span>{modalidadeDeAtendimento}</span>
                        )}
                    </div>

                    {isProfissional && (
                        <div className="containerInfoProf">

                            {/* Valor Consulta */}
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

                            {/* Duração da Consulta */}
                            <h2>Duração da Consulta:</h2>
                            {modoEdicao ? (
                                <input
                                    type="number"
                                    value={duracaoConsulta}
                                    onChange={(e) => setDuracaoConsulta(e.target.value)}
                                    placeholder="Minutos"
                                />
                            ) : (
                                <span>{duracaoConsulta} minutos</span>
                            )}

                            {/* Especialidades */}
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
                                                    <img src={iconeDeleteLixo} alt="" className="iconeDeleteLixo" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="especialidade" key={i}>{esp}</p>
                                    )
                                )}
                            </div>
                            {/* Botão Adicionar Especialidade (Apenas para Profissional em Edição) */}
                            {modoEdicao && (
                                <button
                                    onClick={adicionarEspecialidade}
                                    className="adicionarEspecialidade"
                                >
                                    Adicionar Especialidade
                                </button>
                            )}
                        </div>
                        )}

                    {!modoEdicao && usuarioLogado?._id !== usuario?._id && (
                        <button
                            className="envieMensagem"
                            onClick={() => navigate(`/chat/${usuario?._id}`)}
                            >
                                Envie uma Mensagem!
                        </button>
                    )}
                </div>
                {isProfissional && (
                    <div className="Agenda">
                         <Agenda
                            profissionalId={usuario._id}
                            modalidade={modalidadeDeAtendimento as ('Online' | 'Presencial' | 'Híbrido')}
                        />

                        {isMeuPerfil && modoEdicao && (
                        <button
                            className="botao-editar-horarios-disponiveis"
                            onClick={() => navigate(`/perfil/${usuario._id}/editar/agenda`)}
                        >
                            Edite os seus horários disponíveis
                        </button>
                        )}
                    </div>
                    )}
            </div>
        </div>
    );
}