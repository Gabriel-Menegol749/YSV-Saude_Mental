import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from '../contextos/ContextoAutenticacao.tsx'
import { buscarPerfil, atualizarPerfil } from "../services/api.ts";
import './PerfilPessoal.css'

// Importações dos componentes das seções do perfil
import DadosPessoais from '../components/componentesPerfilPessoal/DadosPessoais.tsx'
import SobreMim from '../components/componentesPerfilPessoal/SobreMim.tsx'
import FormacaoAcademica from '../components/componentesPerfilPessoal/FormacaoAcademica.tsx'
import FotoConsultorio from '../components/componentesPerfilPessoal/FotoConsultorio.tsx' // Importação corrigida
import Avaliacoes from '../components/componentesPerfilPessoal/Avaliacoes.tsx'
import SecaoCustomizada from '../components/componentesPerfilPessoal/SecaoCustomizada.tsx'

interface Formacao {
    curso: string;
    instituicao: string;
    inicio: string;
    conclusao: string;
    certificado: string;
    aindaCursando: boolean;
}

interface Secao {
    id: number;
    titulo: string;
    conteudo: string;
}

interface PerfilCompleto {
    _id: string;
    nome: string;
    email: string,
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
    };
    infoCliente?:{
        resumoPessoal?: string;
    }
    secoesDinamicas?: Secao[];
}

interface PerfilPessoalProps {
    modo?: "visualizacao" | "edicao";
}

const PerfilPessoal = ({ modo = "visualizacao"}: PerfilPessoalProps) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { usuario: usuarioLogado, atualizarUsuario } = useAuth();

    const [ dadosDoPerfil, setDadosDoPerfil ] = useState<PerfilCompleto | null>(null);
    const [ carregando, setCarregando ] = useState(true);
    const [ erro, setErro ] = useState<string | null>(null);

    const isMeuPerfil = usuarioLogado?._id === id;
    const modoAtual = modo;

    // Estados locais para edição (centralizados aqui)
    const [textoSobreMim, setTextoSobreMim] = useState('');
    const [videoSobreMim, setVideoSobreMim] = useState('');
    const [formacoes, setFormacoes] = useState<Formacao[]>([]);
    const [nomeConsultorio, setNomeConsultorio] = useState('');
    const [fotosConsultorio, setFotosConsultorio] = useState<string[]>([]);
    const [secoesPersonalizadas, setSecoesPersonalizadas] = useState<Secao[]>([]);

    const carregarDados = useCallback(async (perfilId: string) => {
        setCarregando(true);
        setErro(null);
        try{
            const dados: PerfilCompleto = await buscarPerfil(perfilId);
            setDadosDoPerfil(dados);
            
            // Sincronizando estados locais
            if (dados.infoProfissional) {
                setTextoSobreMim(dados.infoProfissional.descricao || '');
                setFormacoes(dados.infoProfissional.certificados || []);
                setNomeConsultorio(dados.infoProfissional.nomeConsultorio || '');
                setFotosConsultorio(dados.infoProfissional.fotoConsultorio || []);
            } else if (dados.infoCliente) {
                setTextoSobreMim(dados.infoCliente.resumoPessoal || '');
            }
            setSecoesPersonalizadas(dados.secoesDinamicas || []);

        } catch (error){
            console.error("Erro ao carregar o perfil:", error);
            setErro("Não foi possível carregar o perfil. verifique o ID");
        } finally {
            setCarregando(false);
        }
    }, [])

    useEffect(() => {
        if (id){
            carregarDados(id);
        } else if (usuarioLogado?._id){
            navigate(`/perfil/${usuarioLogado._id}`, {replace: true});
        } else {
            navigate('/Autenticacao');
        }
    }, [id, usuarioLogado?._id, navigate, carregarDados])

    const handleSave = async (atualizacoes: Partial<PerfilCompleto>) => {
        if(!isMeuPerfil || !dadosDoPerfil) return;

        // Consolidação dos estados locais
        const dadosParaEnviar: Partial<PerfilCompleto> = {
            ...atualizacoes, 
            
            ...(dadosDoPerfil.tipoUsuario === 'Profissional' ? {
                infoProfissional: {
                    ...dadosDoPerfil.infoProfissional,
                    descricao: textoSobreMim,
                    certificados: formacoes,
                    nomeConsultorio: nomeConsultorio,
                    fotoConsultorio: fotosConsultorio,
                }
            } : {
                infoCliente: {
                    ...dadosDoPerfil.infoCliente,
                    resumoPessoal: textoSobreMim,
                }
            }),
            secoesDinamicas: secoesPersonalizadas,
        };

        try{
            const perfilAtualizado = await atualizarPerfil(dadosParaEnviar);

            setDadosDoPerfil(perfilAtualizado as PerfilCompleto);
            atualizarUsuario(perfilAtualizado);
            alert("Perfil atualizado");

            if (modoAtual === 'edicao') {
                 navigate(`/perfil/${id}`);
            }
        } catch(error){
            console.error("Falha ao salvar o perfil: ", error);
            alert("Erro ao salvar o perfil. Tente novamente.");
        }
    };

    const iniciarEdicao = () => {
        if (isMeuPerfil){
            navigate(`/perfil/${id}/editar`);
        }
    };

    const adicionarSecao = (titulo: string, conteudo: string) => {
        const novaSecao: Secao = {
            id: Date.now(),
            titulo,
            conteudo,
        };
        setSecoesPersonalizadas([...secoesPersonalizadas, novaSecao]);
    }

    if (carregando) return <p className="CarregandoPerfil">Carregando Perfil...</p>;
    if (erro || !dadosDoPerfil) return <p className="ErroPerfil"> {erro || "Perfil não encontrado!"}</p>;

    const isCliente = dadosDoPerfil.tipoUsuario === "Cliente";
    const isProfissional = dadosDoPerfil.tipoUsuario === "Profissional";
    const isVisualizacao = modoAtual === "visualizacao";
    const isEdicao = modoAtual === "edicao";

    return (
        <div className="perfil-pessoal-container">

        {isMeuPerfil && isVisualizacao && (
            <button className="botaoEditarPerfil" onClick={iniciarEdicao}> Editar meu Perfil</button>
        )}

        <DadosPessoais
            usuario={dadosDoPerfil}
            modo={modoAtual}
            isMeuPerfil={isMeuPerfil}
            onSave={handleSave}
        />

        <SobreMim
            usuario={dadosDoPerfil}
            modo={modoAtual}
            isMeuPerfil={isMeuPerfil}
            onSave={handleSave}
            textoSobreMim={textoSobreMim}
            videoSobreMim={videoSobreMim}
            setTextoSobreMim={setTextoSobreMim}
            setVideoSobreMim={setVideoSobreMim}
        />

        {isProfissional && (
            <>
                <FormacaoAcademica
                    usuario={dadosDoPerfil}
                    modo={modoAtual}
                    isMeuPerfil={isMeuPerfil}
                    onSave={handleSave}
                    formacoes={formacoes}
                    setFormacoes={setFormacoes}
                />

                <FotoConsultorio
                    usuario={dadosDoPerfil}
                    modo={modoAtual}
                    isMeuPerfil={isMeuPerfil}
                    onSave={handleSave}
                    nomeConsultorio={nomeConsultorio}
                    fotos={fotosConsultorio}
                    setNomeConsultorio={setNomeConsultorio}
                    setFotos={setFotosConsultorio}
                />

                <Avaliacoes
                    usuario={dadosDoPerfil}
                    modo={modoAtual}
                    isMeuPerfil={isMeuPerfil}
                    onSave={handleSave}
                />
            </>
        )}

        {secoesPersonalizadas.map((secao) => (
            <div key={secao.id} className="secaoPersonalizada">
                <h2>{secao.titulo}</h2>
                <hr />
                <p>{secao.conteudo}</p>
                {/* Se quiser permitir remover, você precisará adicionar um botão aqui e usar a função removerSecao */}
            </div>
        ))}

        {isMeuPerfil && isEdicao && (
            <SecaoCustomizada // Usando o componente que você criou
                modo={modoAtual}
                onAddSecao={adicionarSecao}
                isMeuPerfil={isMeuPerfil}
                onSave={handleSave}
            />
        )}
        </div>
    );
};

export default PerfilPessoal;