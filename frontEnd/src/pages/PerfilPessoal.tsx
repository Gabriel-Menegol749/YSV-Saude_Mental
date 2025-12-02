import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from '../contextos/ContextoAutenticacao.tsx';

import api from '../services/api.ts'
import './PerfilPessoal.css';

//Import dos componentes filhos
import DadosPessoais from '../components/componentesPerfilPessoal/DadosPessoais';
import SobreMim from '../components/componentesPerfilPessoal/SobreMim';
import FormacaoAcademica from '../components/componentesPerfilPessoal/FormacaoAcademica';
import FotoConsultorio from '../components/componentesPerfilPessoal/FotoConsultorio';
import Avaliacoes from '../components/componentesPerfilPessoal/Avaliacoes';
import SecaoCustomizada from '../components/componentesPerfilPessoal/SecaoCustomizada';

//Interfaces
interface Formacao {
    nome: string;
    instituicao: string;
    inicio: string;
    conclusao: string;
    certificado: string;
    aindaCursando: boolean;
}

interface Secao {
    _id?: string;
    titulo: string;
    conteudo: string;
}

interface InfoProfissional {
    profissao?: string;
    crp?: string;
    especialidades?: string[];
    valorConsulta?: string;
    duracaoConsulta?: string;
    modalidadeDeAtendimento?: 'Online' | 'Presencial';
    enderecoConsultorio?: string;
    fotosConsultorio?: string[];
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
    const { usuario: usuarioLogado, carregando: carregandoAuth, atualizarUsuario } = useAuth();

    const [ dadosDoPerfil, setDadosDoPerfil ] = useState<PerfilCompleto | null>(null);
    const [ perfilEmEdicao, setPerfilEmEdicao ] = useState<PerfilCompleto | null>(null);
    const [ carregando, setCarregando ] = useState(true);
    const [ erro, setErro ] = useState<string | null>(null);
    const [novaFotoPerfilFile, setNovaFotoPerfilFile] = useState<File | null>(null);
    const [previewFotoUrl, setPreviewFotoUrl] = useState<string | null | undefined>(undefined);
    const [novoVideoSobreMimFile, setNovoVideoSobreMimFile] = useState<File | null>(null);
    const [removerVideoSobreMim, setRemoverVideoSobreMim] = useState(false);

    const isMeuPerfil = !!(usuarioLogado && id && usuarioLogado._id === id);
    const isEdicao = location.pathname.endsWith('/editar');
    const isProfissional = perfilEmEdicao?.tipoUsuario === 'Profissional';

    const getMediaBaseUrl = () => {
        const currentBaseUrl = api.defaults.baseURL || '';
        if(currentBaseUrl.endsWith('/api')){
            return currentBaseUrl.substring(0, currentBaseUrl.length -4);
        }
        return currentBaseUrl;
    }

    const carregarDados = useCallback(async (perfilId: string) => {
        setCarregando(true);
        setErro(null);
        try {
            let dados: PerfilCompleto;
            if (isMeuPerfil) {
                const res = await api.get(`/usuarios/meu-perfil`);
                dados = res.data;
            } else {
                const res = await api.get(`/usuarios/${perfilId}`);
                dados = res.data;
            }
            setDadosDoPerfil(dados);
            setPerfilEmEdicao(dados);
            setPreviewFotoUrl(undefined);
        } catch (error: any) {
            console.error("Erro ao carregar o perfil:", error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                setErro("Sessão expirada ou não autorizado. Faça login novamente.");
                if (isMeuPerfil) {
                    navigate('/Autenticacao?modo=login');
                }
            } else {
                setErro("Não foi possível carregar o perfil. Verifique o ID ou tente novamente.");
            }
        } finally {
            setCarregando(false);
        }
    }, [isMeuPerfil, navigate]);

    useEffect(() => {
        if (carregandoAuth) {
            return;
        }
        if (id) {
            carregarDados(id);
        } else if (usuarioLogado && usuarioLogado._id) {
            navigate(`/perfil/${usuarioLogado._id}`);
        } else {
            navigate('/Autenticacao?modo=login');
        }
    }, [id, usuarioLogado, carregandoAuth, carregarDados, navigate]);


    const handleUpdate = useCallback(<T extends keyof PerfilCompleto>(
        campo: T,
        valor: PerfilCompleto[T]
    ) => {
        setPerfilEmEdicao(prev => {
            if(!prev) return null;

            const infoProfissionalFields: (keyof InfoProfissional)[] = [
                'profissao', 'crp', 'especialidades', 'formacoes', 'fotosConsultorio',
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

const handleSave = async () => {
    if (!isMeuPerfil || !perfilEmEdicao) return;
    const payload = { ...perfilEmEdicao };

    try {
    if(novaFotoPerfilFile){
        const formData = new FormData();
        formData.append('fotoPerfilFile', novaFotoPerfilFile);

    const resUpload = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    payload.fotoPerfil = resUpload.data.url;
    } else if (previewFotoUrl === null){
        payload.fotoPerfil = undefined;
    }

    if(novoVideoSobreMimFile){
        const formData = new FormData();
        formData.append('videoSobreMimFile', novoVideoSobreMimFile);
        const resUpload = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        payload.videoSobreMim = resUpload.data.url;
        setRemoverVideoSobreMim(false);
    } else if (removerVideoSobreMim) {
        payload.videoSobreMim = '';
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
        payloadFinal.profissao = payload.infoProfissional.profissao;
        payloadFinal.crp = payload.infoProfissional.crp;
        payloadFinal.modalidadeDeAtendimento = payload.infoProfissional.modalidadeDeAtendimento;
        payloadFinal.valorConsulta = payload.infoProfissional.valorConsulta;
        payloadFinal.duracaoConsulta = payload.infoProfissional.duracaoConsulta;
        payloadFinal.enderecoConsultorio = payload.infoProfissional.enderecoConsultorio;
        payloadFinal.especialidades = payload.infoProfissional.especialidades || [];
        payloadFinal.formacoes = payload.infoProfissional.formacoes || [];

        payloadFinal.fotosConsultorio = (payload.infoProfissional.fotosConsultorio || [])
            .filter(foto => foto && typeof foto === 'string');

    }

        try {
            const res = await api.put(`/usuarios/perfil`, payloadFinal);
            const perfilAtualizado = res.data;
            setDadosDoPerfil(perfilAtualizado as PerfilCompleto);
            setPerfilEmEdicao(perfilAtualizado as PerfilCompleto);
            atualizarUsuario(perfilAtualizado);

            setNovaFotoPerfilFile(null)
            setNovoVideoSobreMimFile(null);
            setRemoverVideoSobreMim(false);
            setPreviewFotoUrl(undefined);

            alert("Perfil atualizado!");
            if (isEdicao) navigate(`/perfil/${id}`);
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            alert("Erro ao salvar perfil. Veja o console para detalhes.");
        }
    };

    //Edições das seções personalizadas
    const handleAddSecao = (titulo: string, conteudo: string) => {
        const novaSecao: Secao = { _id: crypto.randomUUID(), titulo, conteudo };
        handleUpdate('secoesDinamicas', [...(perfilEmEdicao?.secoesDinamicas || []), novaSecao]);
    };

    const handleEditSecao = (secaoId: string, campo: "titulo" | "conteudo", valor: string) => {
        const secoesAtualizadas = (perfilEmEdicao?.secoesDinamicas || []).map(secao =>
            secao._id === secaoId ? { ...secao, [campo]: valor } : secao
        )
        handleUpdate('secoesDinamicas', secoesAtualizadas);
    };

    const handleDeleteSecao = (secaoId: string) => {
        const secoesFiltradas = (perfilEmEdicao?.secoesDinamicas || []).filter(s => s._id !== secaoId);
        handleUpdate('secoesDinamicas', secoesFiltradas);
    };

    if (carregando) return <p className="CarregandoPerfil">Carregando Perfil...</p>;
    if (erro || !dadosDoPerfil || !perfilEmEdicao) return <p className="ErroPerfil">{erro || "Perfil não encontrado!"}</p>;

    const usuarioComFotoCompleta = perfilEmEdicao.fotoPerfil && !perfilEmEdicao.fotoPerfil.startsWith('http')
        ? {
            ...perfilEmEdicao,
            fotoPerfil: `${getMediaBaseUrl()}${perfilEmEdicao.fotoPerfil}`
        }
        : perfilEmEdicao;

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
                usuario={usuarioComFotoCompleta}
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
                setProfissao={(valor) => handleUpdate('profissao' as keyof PerfilCompleto, valor as any)}
                crp={perfilEmEdicao.infoProfissional?.crp || ''}
                setCrp={(valor) => handleUpdate('crp' as keyof PerfilCompleto, valor as any)}
                modalidadeDeAtendimento={perfilEmEdicao.infoProfissional?.modalidadeDeAtendimento || ''}
                setAtendimento={(valor) => handleUpdate('modalidadeDeAtendimento' as keyof PerfilCompleto, valor as any)}
                valorConsulta={perfilEmEdicao.infoProfissional?.valorConsulta || ''}
                setValorConsulta={(valor) => handleUpdate('valorConsulta' as keyof PerfilCompleto, valor as any)}
                duracaoConsulta={perfilEmEdicao.infoProfissional?.duracaoConsulta || ''}
                setDuracaoConsulta={(valor) => handleUpdate('duracaoConsulta' as keyof PerfilCompleto, valor as any)}
                especialidades={perfilEmEdicao.infoProfissional?.especialidades || []}
                setEspecialidades={(valor) => handleUpdate('especialidades' as keyof PerfilCompleto, valor as any)}
            />

            <SobreMim
                usuario={perfilEmEdicao}
                modo={isEdicao ? "edicao" : "visualizacao"}
                isMeuPerfil={isMeuPerfil}
                textoSobreMim={perfilEmEdicao.descricao || ''}
                setTextoSobreMim={(valor) => handleUpdate('descricao', valor)}
                videoSobreMim={perfilEmEdicao.videoSobreMim ? `${getMediaBaseUrl()}${perfilEmEdicao.videoSobreMim}` : ''}
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
                        setFormacoes={(valor) => handleUpdate('formacoes' as keyof PerfilCompleto, valor as any)}
                    />

                    <FotoConsultorio
                        usuario={perfilEmEdicao}
                        modo={isEdicao ? "edicao" : "visualizacao"}
                        isMeuPerfil={isMeuPerfil}
                        onSave={handleSave}
                        fotos={perfilEmEdicao.infoProfissional?.fotosConsultorio || []}
                        setFotos={(valor) => handleUpdate('fotosConsultorio' as keyof PerfilCompleto, valor as any)}
                        enderecoConsultorio={perfilEmEdicao.infoProfissional?.enderecoConsultorio || ''}
                        setEnderecoConsultorio={(valor) => handleUpdate('enderecoConsultorio' as keyof PerfilCompleto, valor as any)}
                    />
                </>
            )}

            <SecaoCustomizada
                modo={isEdicao ? "edicao" : "visualizacao"}
                isMeuPerfil={isMeuPerfil}
                secoes={perfilEmEdicao.secoesDinamicas || []}
                onAddSecao={handleAddSecao}
                onDelete={handleDeleteSecao}
                onEdit={handleEditSecao}
            />

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
