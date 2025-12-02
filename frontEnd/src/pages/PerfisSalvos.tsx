import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contextos/ContextoAutenticacao';
import logoPerfil from '../assets/profile-circle-svgrepo-com.svg';
import api from '../services/api.ts'
import './PerfisSalvos.css';

const getMediaBaseUrl = () => {
    const currentBaseUrl = api.defaults.baseURL || '';
    if (currentBaseUrl.endsWith('/api')) {
        return currentBaseUrl.substring(0, currentBaseUrl.length - 4);
    }
    return currentBaseUrl;
};

interface PerfilSalvoCard {
  _id: string;
  nome: string;
  fotoPerfil?: string;
  infoProfissional?: {
    crp?: string;
    profissao?: string;
    valorConsulta?: number;
    duracaoConsulta?: number;
    modalidadeDeAtendimento?: string;
  };
}


const PerfisSalvos = () => {
    const { token } = useAuth();
    const [perfisSalvos, setPerfisSalvos] = useState<PerfilSalvoCard[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

     const formatarModalidade = (modalidade?: string) => {
    if (!modalidade) return 'Não informada';
        return modalidade;
    };


    const buscaPerfisSalvos = useCallback(async () => {
        if (!token) {
            setCarregando(false);
            return;
        }
        setCarregando(true);
        setErro(null);
        try {
            const response = await api.get('/usuarios/PerfisSalvos', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setPerfisSalvos(response.data);
        } catch (err: any) {
            console.error("Erro ao buscar perfis salvos:", err);
            setErro(err.response?.data?.mensagem || "Erro desconhecido ao buscar perfis salvos.");
        } finally {
            setCarregando(false);
        }
    }, [token]);

    const removerPerfil = async (perfilId: string) => {
        try {
            if (!token) {
                alert('Você precisa estar logado para remover perfis!');
                return;
            }

            const confirmacao = window.confirm('Tem certeza que deseja remover este perfil dos seus salvos?');
            if (!confirmacao) return;

            const res = await fetch(`${getMediaBaseUrl()}/api/usuarios/perfis-salvos/${perfilId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                });


            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.mensagem || 'Falha ao remover perfil.');
            }

            alert('Perfil removido com sucesso!');
            buscaPerfisSalvos();
        } catch (error: any) {
            alert(error.message);
        }
    };

    useEffect(() => {
        buscaPerfisSalvos();
    }, [buscaPerfisSalvos]);

    if (carregando) {
        return <div className="perfilSalvos"><p>Carregando perfis salvos...</p></div>;
    }

    if (erro) {
        return <div className="perfilSalvos"><p className="erro-mensagem">Erro: {erro}</p></div>;
    }

    return (
        <div className="perfilSalvos">
            <div className="titulopg">
                <h1>Perfis Salvos</h1>
            </div>
            {perfisSalvos.length === 0 ? (
                <p className="nenhum-salvo">Você ainda não salvou nenhum perfil.</p>
            ) : (
                perfisSalvos.map((perfil) => {
                    const fotoPerfilURL = perfil.fotoPerfil
                        ? (perfil.fotoPerfil.startsWith('http')
                            ? perfil.fotoPerfil
                            : `${getMediaBaseUrl()}${perfil.fotoPerfil}`)
                        : logoPerfil;

                    return (
                        <div className="cardPerfilSalvo" key={perfil._id}>
                            <div className="CabecalhoCard">
                                <h2>
                                    {perfil.nome}
                                    {perfil.infoProfissional?.profissao && ` | ${perfil.infoProfissional.profissao}`}
                                    {perfil.infoProfissional?.crp && ` | CRP ${perfil.infoProfissional.crp}`}
                                </h2>
                                <button
                                    className='removerPerfil'
                                    onClick={() => removerPerfil(perfil._id)}
                                >
                                    Remover perfil
                                </button>
                            </div>
                            <hr />
                            <div className="containerCardProfissional">
                                <div className="conteudoCardPerfil">
                                    <img src={fotoPerfilURL} alt={`Foto de ${perfil.nome}`} />
                                    <div className="infoPerfil">
                                        <h2>Atendimento</h2>
                                        <p>{formatarModalidade(perfil.infoProfissional?.modalidadeDeAtendimento)}</p>

                                        <h2>Valor da Consulta</h2>
                                        <p>R$ {perfil.infoProfissional?.valorConsulta || 'Não informado'}</p>

                                        <h2>Duração da Consulta</h2>
                                        <p>
                                            {perfil.infoProfissional?.duracaoConsulta
                                                ? `${perfil.infoProfissional.duracaoConsulta} minutos`
                                                : 'Não informado'}
                                        </p>
                                    </div>
                                    <div className="BotoesPerfilSalvo">
                                        <Link to={`/perfil/${perfil._id}`}>
                                            <button>Visitar perfil</button>
                                        </Link>
                                        <Link to="/Conversas">
                                            <button>Entrar em Contato!</button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default PerfisSalvos;
