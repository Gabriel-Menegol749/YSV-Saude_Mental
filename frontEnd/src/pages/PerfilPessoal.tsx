import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from '../contextos/ContextoAutenticacao.tsx';
import { buscarPerfil, salvarPerfilCompleto } from "../services/api.ts";
import './PerfilPessoal.css';

import DadosPessoais from '../components/componentesPerfilPessoal/DadosPessoais.tsx';
import SobreMim from '../components/componentesPerfilPessoal/SobreMim.tsx';
import FormacaoAcademica from '../components/componentesPerfilPessoal/FormacaoAcademica.tsx';
import FotoConsultorio from '../components/componentesPerfilPessoal/FotoConsultorio.tsx';
import Avaliacoes from '../components/componentesPerfilPessoal/Avaliacoes.tsx';
import SecaoCustomizada from '../components/componentesPerfilPessoal/SecaoCustomizada.tsx';

interface Formacao { curso: string; instituicao: string; inicio: string; conclusao: string; certificado: string; aindaCursando: boolean; }
interface Secao { id: string; titulo: string; conteudo: string; }

interface PerfilCompleto {
    _id: string;
    nome: string;
    email: string;
    telefoneContato?: string;
    genero?: string;
    fotoPerfil?: string;
    tipoUsuario: 'Cliente' | 'Profissional';
    infoProfissional?: {
        profissao?: string;
        crp?: string;
        especialidades?: string[];
        descricao?: string;
        certificados?: Formacao[];
        fotoConsultorio?: string[];
        nomeConsultorio?: string;
        atendimento?: string;
        valorConsulta?: string;
        duracaoConsulta?: string;
        videoSobreMim?: string;
    };
    infoCliente?: { resumoPessoal?: string; };
    secoesDinamicas?: Secao[];
}

interface PerfilPessoalProps { modo?: "visualizacao" | "edicao"; }

const PerfilPessoal = ({ modo = "visualizacao"}: PerfilPessoalProps) => {
    const API_BASE_URL = 'http://localhost:5000';
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { usuario: usuarioLogado, atualizarUsuario } = useAuth();

    const [dadosDoPerfil, setDadosDoPerfil] = useState<PerfilCompleto | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const isMeuPerfil = usuarioLogado?._id === id;

    //isso daqui me aparentaerrado, endswtih? eu quero que seja utilizado o modo === edicao
    const isEdicao = location.pathname.endsWith("/editar") && isMeuPerfil;

    const [novaFotoPerfilFile, setNovaFotoPerfilFile] = useState<File | null>(null);
    const [previewFotoUrl, setPreviewFotoUrl] = useState<string | null | undefined>(undefined);

    //Dados que devem ser alterados no "Dados Pessoais"
    const [profissao, setProfissao] = useState('');
    const [nome, setNome] = useState('');
    const [crp, setCrp] = useState('');
    const [atendimento, setAtendimento] = useState('');
    const [valorConsulta, setValorConsulta] = useState('');
    const [duracaoConsulta, setDuracaoConsulta] = useState('');
    const [especialidades, setEspecialidades] = useState<string[]>([]);

    const [textoSobreMim, setTextoSobreMim] = useState('');
    const [videoSobreMim, setVideoSobreMim] = useState('');
    const [novoVideoSobreMimFile, setNovoVideoSobreMimFile] = useState<File | null>(null);

    const [formacoes, setFormacoes] = useState<Formacao[]>([]);
    const [nomeConsultorio, setNomeConsultorio] = useState('');
    const [fotosConsultorio, setFotosConsultorio] = useState<string[]>([]);
    const [secoesPersonalizadas, setSecoesPersonalizadas] = useState<Secao[]>([]);

    const carregarDados = useCallback(async (perfilId: string) => {
        setCarregando(true); setErro(null);
        try {
            const dados: PerfilCompleto = await buscarPerfil(perfilId);
            setDadosDoPerfil(dados);

            // Dados básicos
            setNome(dados.nome || '');
            setPreviewFotoUrl(dados.fotoPerfil ?? null);

            if (dados.tipoUsuario === 'Profissional' && dados.infoProfissional) {
                const info = dados.infoProfissional;
                setProfissao(info.profissao || '');
                setCrp(info.crp || '');
                setAtendimento(info.atendimento || '');
                setValorConsulta(info.valorConsulta || '');
                setDuracaoConsulta(info.duracaoConsulta || '');
                setEspecialidades(info.especialidades || []);
                setTextoSobreMim(info.descricao || '');
                setVideoSobreMim(info.videoSobreMim ? `${API_BASE_URL}${info.videoSobreMim}` : '');
                setFormacoes(info.certificados || []);
                setNomeConsultorio(info.nomeConsultorio || '');
                setFotosConsultorio(info.fotoConsultorio || []);
            } else if (dados.tipoUsuario === 'Cliente' && dados.infoCliente) {
                setProfissao('Cliente');
                setTextoSobreMim(dados.infoCliente.resumoPessoal || '');
                setCrp(''); setAtendimento(''); setValorConsulta(''); setDuracaoConsulta(''); setEspecialidades([]);
            }

            setSecoesPersonalizadas(dados.secoesDinamicas || []);
        } catch (error) {
            console.error("Erro ao carregar o perfil:", error);
            setErro("Não foi possível carregar o perfil. Verifique o ID");
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        if (id) carregarDados(id);
        else if (usuarioLogado?._id) navigate(`/perfil/${usuarioLogado._id}`, {replace: true});
        else navigate('/Autenticacao');
    }, [id, usuarioLogado?._id, navigate, carregarDados]);

    const handleSave = async (update?: any) => {
        if (!isMeuPerfil || !dadosDoPerfil) return;
        const isProfissional = dadosDoPerfil.tipoUsuario === 'Profissional';
        const formData = new FormData();

        formData.append('nome', nome);
        formData.append('secoesDinamicas', JSON.stringify(secoesPersonalizadas));
        formData.append('tipoUsuario', dadosDoPerfil.tipoUsuario);

        if (isProfissional) {
            formData.append('profissao', profissao);
            formData.append('crp', crp);
            formData.append('atendimento', atendimento);
            formData.append('valorConsulta', valorConsulta);
            formData.append('duracaoConsulta', duracaoConsulta);
            formData.append('especialidades', JSON.stringify(especialidades.filter(e => e.trim() !== "")));
            formData.append('descricao', textoSobreMim);
            formData.append('certificados', JSON.stringify(formacoes));
            formData.append('nomeConsultorio', nomeConsultorio);
            formData.append('fotoConsultorio', JSON.stringify(fotosConsultorio));
            if (novoVideoSobreMimFile) formData.append("videoSobreMimFile", novoVideoSobreMimFile);
            else if (update?.removerVideoSobreMim === "true") formData.append("removerVideoSobreMim", "true");
        } else {
            formData.append('resumoPessoal', textoSobreMim);
        }

        if (novaFotoPerfilFile) formData.append('fotoPerfilFile', novaFotoPerfilFile);
        else if (previewFotoUrl === null) formData.append('removerFotoPerfil', 'true');

        try {
            const perfilAtualizado = await salvarPerfilCompleto(formData);
            setDadosDoPerfil(perfilAtualizado as PerfilCompleto);
            atualizarUsuario(perfilAtualizado);
            setNovaFotoPerfilFile(null);
            setNovoVideoSobreMimFile(null);
            setVideoSobreMim(perfilAtualizado.infoProfissional?.videoSobreMim || '');
            alert("Perfil atualizado!");
            if (isEdicao) navigate(`/perfil/${id}`);
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            alert("Erro ao salvar perfil. Veja o console para detalhes.");
        }
    };

    const adicionarSecao = (titulo: string, conteudo: string) => {
        const novaSecao: Secao = { id: crypto.randomUUID(), titulo, conteudo };
        setSecoesPersonalizadas([...secoesPersonalizadas, novaSecao]);
    };

    if (carregando) return <p className="CarregandoPerfil">Carregando Perfil...</p>;
    if (erro || !dadosDoPerfil) return <p className="ErroPerfil">{erro || "Perfil não encontrado!"}</p>;

    const isProfissional = dadosDoPerfil.tipoUsuario === "Profissional";

    const editarSecao = (id: string, campo: "titulo" | "conteudo", valor: string) => {
        setSecoesPersonalizadas(secoesPersonalizadas.map(secao =>
            secao.id === id ? { ...secao, [campo]: valor } : secao
        ));
    };

    return (
        <div className="perfil-pessoal-container">
            {isMeuPerfil && isEdicao && (
                <div className="botoesEdicao">
                    <h2>Salvar alterações:</h2>
                    <button onClick={() => setEdicao(false)} className="botaoCancelarEdicoes">Cancelar</button>
                    <button onClick={() => handleSave()} className="botaoSalvarEdicoes">Salvar</button>
                </div>
            )}

            <DadosPessoais
                usuario={dadosDoPerfil}
                modo={isEdicao ? "edicao" : "visualizacao"}
                isMeuPerfil={isMeuPerfil}
                onToggleEdicao={() => navigate(isEdicao ? `/perfil/${id}` : `/perfil/${id}/editar`)}
                onSave={handleSave}
                previewFotoUrl={previewFotoUrl}
                setNovaFotoPerfilFile={setNovaFotoPerfilFile}
                setPreviewFotoUrl={setPreviewFotoUrl}
                nome={nome} setNome={setNome}
                profissao={profissao} setProfissao={setProfissao}
                crp={crp} setCrp={setCrp}
                atendimento={atendimento} setAtendimento={setAtendimento}
                valorConsulta={valorConsulta} setValorConsulta={setValorConsulta}
                duracaoConsulta={duracaoConsulta} setDuracaoConsulta={setDuracaoConsulta}
                especialidades={especialidades} setEspecialidades={setEspecialidades}
            />

            <SobreMim
                usuario={dadosDoPerfil}
                modo={isEdicao ? "edicao" : "visualizacao"}
                isMeuPerfil={isMeuPerfil}
                textoSobreMim={textoSobreMim}
                setTextoSobreMim={setTextoSobreMim}
                videoSobreMim={videoSobreMim}
                setNovoVideoSobreMimFile={setNovoVideoSobreMimFile}
            />

            {isProfissional && (
                <>
                    <FormacaoAcademica usuario={dadosDoPerfil} modo={isEdicao ? "edicao" : "visualizacao"} isMeuPerfil={isMeuPerfil} onSave={handleSave} formacoes={formacoes} setFormacoes={setFormacoes}/>
                    <FotoConsultorio usuario={dadosDoPerfil} modo={isEdicao ? "edicao" : "visualizacao"} isMeuPerfil={isMeuPerfil} onSave={handleSave} nomeConsultorio={nomeConsultorio} fotos={fotosConsultorio} setNomeConsultorio={setNomeConsultorio} setFotos={setFotosConsultorio}/>
                </>
            )}

            {isMeuPerfil && modo === "edicao" && (
            <SecaoCustomizada
                modo="edicao"
                isMeuPerfil={true}
                secoes={secoesPersonalizadas}
                onAddSecao={(titulo, conteudo) => {
                    const nova = {
                        id: crypto.randomUUID(),
                        titulo,
                        conteudo
                    };
                    setSecoesPersonalizadas([...secoesPersonalizadas, nova]);
                }}
                onDelete={(id) => {
                    setSecoesPersonalizadas(secoesPersonalizadas.filter(s => s.id !== id));
                }}
                onEdit={editarSecao}
            />
        )}


            {isProfissional && (
                <>
                <Avaliacoes usuario={dadosDoPerfil} modo={isEdicao ? "edicao" : "visualizacao"} isMeuPerfil={isMeuPerfil} onSave={handleSave}/>
                </>
            )}
        </div>
    );
};

export default PerfilPessoal;
