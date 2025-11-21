import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from '../contextos/ContextoAutenticacao.tsx';
import { buscarPerfil, atualizarPerfil, uploadImagem } from "../services/api.ts";
import './PerfilPessoal.css';

//Import dos componentes filhos
import DadosPessoais from '../components/componentesPerfilPessoal/DadosPessoais';
import SobreMim from '../components/componentesPerfilPessoal/SobreMim';
import FormacaoAcademica from '../components/componentesPerfilPessoal/FormacaoAcademica';
import FotoConsultorio from '../components/componentesPerfilPessoal/FotoConsultorio';
import Avaliacoes from '../components/componentesPerfilPessoal/Avaliacoes';
import SecaoCustomizada from '../components/componentesPerfilPessoal/SecaoCustomizada';

//Possível alteração
interface Formacao {
    nome: string;
    instituicao: string;
    inicio: string;
    conclusao: string;
    certificado: string;
    aindaCursando: boolean;
}
interface Secao {
    id: string;
    titulo: string;
    conteudo: string;
}

interface InfoProfissional {
    profissao?: string;
    crp?: string;
    especialidades?: string[];
    valorConsulta?: string;
    duracaoConsulta?: string;
    modalidadeDeAtendimento?: string;
    enderecoConsultorio?: string;
    fotoConsultorio?: string[];
    //Aqui não deveria ser formacoes? você sugeriu trocar por certiifcados
    formacoes?: Formacao[];
}
interface PerfilCompleto {
    _id: string;
    nome: string;
    email: string;
    fotoPerfil?: string;
    tipoUsuario: 'Cliente' | 'Profissional';
    descricao?: string;
    videoSobreMim?: string;
    infoProfissional?: InfoProfissional;
    secoesDinamicas?: Secao[];
}


const PerfilPessoal = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { usuario: usuarioLogado, atualizarUsuario } = useAuth();
    const API_BASE_URL = 'http://localhost:5000';

    const [ dadosDoPerfil, setDadosDoPerfil ] = useState<PerfilCompleto | null>(null);
    const [ perfilEmEdicao, setPerfilEmEdicao ] = useState<PerfilCompleto | null>(null);
    const [ carregando, setCarregando ] = useState(true);
    const [ erro, setErro ] = useState<string | null>(null);

    const [novaFotoPerfilFile, setNovaFotoPerfilFile] = useState<File | null>(null);
    const [previewFotoUrl, setPreviewFotoUrl] = useState<string | null | undefined>(undefined);
    const [novoVideoSobreMimFile, setNovoVideoSobreMimFile] = useState<File | null>(null);
    const [removerVideoSobreMim, setRemoverVideoSobreMim] = useState(false);

    const isMeuPerfil = usuarioLogado?._id === id;
    const isEdicao = location.pathname.endsWith("/editar") && isMeuPerfil;
    const isProfissional = perfilEmEdicao?.tipoUsuario === 'Profissional';

    const handleUpdate = useCallback(< T extends keyof PerfilCompleto>(
        campo: T,
        valor: PerfilCompleto[T]
    ) => {
        setPerfilEmEdicao(prev => {
            if(!prev) return null;

            const infoProfissionalFields: (keyof InfoProfissional)[] = [
                'profissao', 'crp', 'especialidades', 'formacoes', 'fotoConsultorio',
                'modalidadeDeAtendimento', 'valorConsulta', 'duracaoConsulta', 'enderecoConsultorio'
            ];
            if (isProfissional && infoProfissionalFields.includes(campo as keyof InfoProfissional)) {
                return {
                    ...prev,
                    infoProfissional: {
                        ...prev.infoProfissional,
                        [campo]: valor
                    }
                } as PerfilCompleto;
            }
            return {
                ...prev,
                [campo]: valor
            } as PerfilCompleto;
        });
    }, [isProfissional]);

    const carregarDados = useCallback(async (perfilId: string) => {
        setCarregando(true); setErro(null);
        try{
            const dados: PerfilCompleto = await buscarPerfil(perfilId);
            setDadosDoPerfil(dados);
            setPerfilEmEdicao(dados);
            setPreviewFotoUrl(dados.fotoPerfil ?? null);
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

    const handleSave = async () => {
        if (!isMeuPerfil || !perfilEmEdicao) return;
        const payload = { ...perfilEmEdicao };

        try{
            if(novaFotoPerfilFile){
                const {url} = await uploadImagem(novaFotoPerfilFile, 'perfil');
                payload.fotoPerfil = url;
            } else if (previewFotoUrl === null){
                payload.fotoPerfil = undefined;
            }

            if(novoVideoSobreMimFile){
                const { url } = await uploadImagem(novoVideoSobreMimFile, 'video');
                payload.videoSobreMim = url;
                setRemoverVideoSobreMim(false);
            } else if (removerVideoSobreMim) {
                payload.videoSobreMim = undefined;
            }
            } catch (error) {
            console.error("Erro durante o upload de arquivos:", error);
            alert("Erro ao fazer upload dos arquivos. O salvamento foi cancelado.");
            return;
        }

        const payloadFinal: any = {
            nome: payload.nome,
            fotoPerfil: payload.fotoPerfil,
            secoesDinamicas: payload.secoesDinamicas || [],
            descricao: payload.descricao,
            videoSobreMim: payload.videoSobreMim,
        };

        if (isProfissional && payload.infoProfissional) {
             const infoUpdates: Partial<InfoProfissional> = {
                profissao: payload.infoProfissional.profissao,
                crp: payload.infoProfissional.crp,
                modalidadeDeAtendimento: payload.infoProfissional.modalidadeDeAtendimento,
                valorConsulta: payload.infoProfissional.valorConsulta,
                duracaoConsulta: payload.infoProfissional.duracaoConsulta,
                enderecoConsultorio: payload.infoProfissional.enderecoConsultorio,
                especialidades: payload.infoProfissional.especialidades || [],
                formacoes: payload.infoProfissional.formacoes || [],
                fotoConsultorio: payload.infoProfissional.fotoConsultorio || [],
            };
            Object.assign(payloadFinal, infoUpdates);
        }

        try {
            const perfilAtualizado = await atualizarPerfil(payloadFinal);

            setDadosDoPerfil(perfilAtualizado as PerfilCompleto);
            setPerfilEmEdicao(perfilAtualizado as PerfilCompleto);
            atualizarUsuario(perfilAtualizado);

            setNovaFotoPerfilFile(null)
            setNovoVideoSobreMimFile(null);
            setRemoverVideoSobreMim(false);

            alert("Perfil atualizado!");
            if (isEdicao) navigate(`/perfil/${id}`);
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            alert("Erro ao salvar perfil. Veja o console para detalhes.");
        }
    };

    //Edições das seções personalizadas
    const handleAddSecao = (titulo: string, conteudo: string) => {
        const novaSecao: Secao = { id: crypto.randomUUID(), titulo, conteudo };
        handleUpdate('secoesDinamicas', [...(perfilEmEdicao?.secoesDinamicas || []), novaSecao]);
    };

    const handleEditSecao = (secaoId: string, campo: "titulo" | "conteudo", valor: string) => {
        const secoesAtualizadas = (perfilEmEdicao?.secoesDinamicas || []).map(secao =>
            secao.id === secaoId ? { ...secao, [campo]: valor } : secao
        )
            handleUpdate('secoesDinamicas', secoesAtualizadas);
    };

    const handleDeleteSecao = (secaoId: string) => {
        const secoesFiltradas = (perfilEmEdicao?.secoesDinamicas || []).filter(s => s.id !== secaoId);
            handleUpdate('secoesDinamicas', secoesFiltradas);
    };

    if (carregando) return <p className="CarregandoPerfil">Carregando Perfil...</p>;
    if (erro || !dadosDoPerfil || !perfilEmEdicao) return <p className="ErroPerfil">{erro || "Perfil não encontrado!"}</p>;

    return (
        <div className="perfil-pessoal-container">
            {isMeuPerfil && isEdicao && (
                <div className="botoesEdicao">
                    <h2>Salvar alterações:</h2>
                    <button onClick={() => navigate(`/perfil/${id}`)} className="botaoCancelarEdicoes">Cancelar</button>
                    <button onClick={handleSave} className="botaoSalvarEdicoes">Salvar</button>
                </div>
            )}

            <DadosPessoais
                usuario={perfilEmEdicao}
                modo={isEdicao ? "edicao" : "visualizacao"}
                isMeuPerfil={isMeuPerfil}
                onToggleEdicao={() => navigate(isEdicao ? `/perfil/${id}` : `/perfil/${id}/editar`)}
                onSave={handleSave}

                nome={perfilEmEdicao.nome}
                setNome={(valor) => handleUpdate('nome', valor)}
                previewFotoUrl={previewFotoUrl}
                setNovaFotoPerfilFile={setNovaFotoPerfilFile}
                setPreviewFotoUrl={setPreviewFotoUrl}

                profissao={perfilEmEdicao.infoProfissional?.profissao || ''}
                setProfissao={(valor) => handleUpdate('profissao', valor)}
                setCrp={(valor) => handleUpdate('crp', valor)}

                atendimento={perfilEmEdicao.infoProfissional?.modalidadeDeAtendimento || ''} 
                setAtendimento={(valor) => handleUpdate('modalidadeDeAtendimento', valor)}
                valorConsulta={perfilEmEdicao.infoProfissional?.valorConsulta || ''}
                setValorConsulta={(valor) => handleUpdate('valorConsulta', valor)}
                duracaoConsulta={perfilEmEdicao.infoProfissional?.duracaoConsulta || ''}
                setDuracaoConsulta={(valor) => handleUpdate('duracaoConsulta', valor)}
                especialidades={perfilEmEdicao.infoProfissional?.especialidades || []}
                setEspecialidades={(valor) => handleUpdate('especialidades', valor)}
            />

            <SobreMim
                usuario={perfilEmEdicao}
                modo={isEdicao ? "edicao" : "visualizacao"}
                isMeuPerfil={isMeuPerfil}
                textoSobreMim={perfilEmEdicao.descricao || ''}
                setTextoSobreMim={(valor) => handleUpdate('descricao', valor)}
                videoSobreMim={perfilEmEdicao.videoSobreMim ? `${API_BASE_URL}${perfilEmEdicao.videoSobreMim}` : ''}
                setNovoVideoSobreMimFile={setNovoVideoSobreMimFile}
                removerVideoSobreMim={removerVideoSobreMim}
                setRemoverVideoSobreMim={setRemoverVideoSobreMim}
            />

            {isProfissional && (
                <>
                    <FormacaoAcademica 
                        usuario={perfilEmEdicao}
                        modo={isEdicao ? "edicao" : "visualizacao"}
                        isMeuPerfil={isMeuPerfil}
                        onSave={handleSave}
                        formacoes={perfilEmEdicao.infoProfissional?.formacoes || []}
                        setFormacoes={(valor) => handleUpdate('formacoes', valor)}
                    />
                    <FotoConsultorio
                        usuario={perfilEmEdicao}
                        modo={isEdicao ? "edicao" : "visualizacao"}
                        isMeuPerfil={isMeuPerfil}
                        onSave={handleSave}
                        fotos={perfilEmEdicao.infoProfissional?.fotoConsultorio || []}
                        setFotos={(valor) => handleUpdate('fotoConsultorio', valor)}
                    />
                </>
            )}
            {(isMeuPerfil && isEdicao) ? (
                <SecaoCustomizada
                    modo="edicao"
                    isMeuPerfil={true}
                    secoes={perfilEmEdicao.secoesDinamicas || []}
                    onAddSecao={handleAddSecao}
                    onDelete={handleDeleteSecao}
                    onEdit={handleEditSecao}
                />
            ) : (
                (perfilEmEdicao.secoesDinamicas || []).map((secao, index) => (
                    <SecaoCustomizada
                        key={secao.id || index}
                        modo="visualizacao"
                        secoes={[secao]}
                    />
                ))
            )}

            {isProfissional && (
                <Avaliacoes
                    usuario={perfilEmEdicao}
                    modo={isEdicao ? "edicao" : "visualizacao"}
                    isMeuPerfil={isMeuPerfil}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default PerfilPessoal;