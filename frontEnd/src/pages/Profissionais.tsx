import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
//Icones
import iconedelete from '../assets/icone-deleta.png';
import setaPrabaixo from '../assets/seta-PraBaixo.png';
import iconePesquisa from '../assets/search.png';
import iconeSalvar from '../assets/salve.png';
import fotoProfissionalPadrao from '../assets/profile-circle-svgrepo-com.svg';
import fotoESTRELAFUTURAMENTEDELETAR from "../assets/fotESTRELASDELETAR.png";
//componentes
import Agenda from "../components/Agenda";
import api from '../services/api.ts'
import './Profissionais.css'

const getMediaBaseUrl = () => {
    const currentBaseUrl = api.defaults.baseURL || '';
    if (currentBaseUrl.endsWith('/api')) {
        return currentBaseUrl.substring(0, currentBaseUrl.length - 4);
    }
    return currentBaseUrl;
};


interface ProfissionalCard {
    _id: string;
    nome: string;
    fotoPerfil?: string;
    descricao?: string;
    videoSobreMim?: string;
    infoProfissional: {
        crp?: string;
        profissao?: string;
        especialidades?: string[];
        valorConsulta?: number;
        duracaoConsulta?: number;
        enderecoConsultorio?: string,
        descricao?: string;
        modalidadeDeAtendimento?: string[];
    };
}

interface Filtros {
    especialidade: string,
    localidade: string,
    valorMaximo: string,
    modalidadeDeAtendimento: string,
}


const valorMinimo = 50;
const valorMAXIMO = 500;

const Profissionais = () => {
    const [profissionais, setProfissionais] = useState<ProfissionalCard[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string>('');
    const [searchParams, setSearchParams] = useSearchParams();
    const [filtrosForm, setFiltrosForm] = useState<Filtros>({
        especialidade: searchParams.get('especialidade') || '',
        localidade: searchParams.get('localidade') || '',
        valorMaximo: searchParams.get('valorMaximo') || valorMAXIMO.toString(),
        modalidadeDeAtendimento: searchParams.get('modalidade') || '',
    })
    const [menuAberto, setMenuAberto] = useState<string | null>(null);
    const [estados, setEstados] = useState<string[]>([]);

    const especialidadeRef = useRef<HTMLDivElement>(null);
    const localidadeRef = useRef<HTMLDivElement>(null);

    const sugestoesIniciais = [
        'Ansiedade e Estresse',
        'Depressão e Tristeza Profunda',
        'Saúde Mental no Trabalho e Burnout',
        'Saúde Sexual e Questões de Gênero/Sexualidade',
        'Manejo de Raiva e Impulsividade',
        'Transtornos do Neuro desenvolvimento',
        'Diagnóstico e Avaliação de Pacientes',
        'Orientação Profissional',
        'Dependência Química e Vícios',
        'Transtornos de Humor',
        'Desenvolvimento Pessoal e Autoconhecimento',
        'Transtornos Alimentares',
        'Questões de Relacionamento e Conflitos Familiares',
        'Luto e Perdas',
        'Transtornos do Sono'
    ]

    interface EstadoIBGE {
        id: number;
        nome: string;
        sigla: string;
    }

   useEffect(() => {
        const buscaEstados = async () => {
            try {
                const resposta = await fetch(
                    "https://servicodados.ibge.gov.br/api/v1/localidades/estados"
                );
                const dados = await resposta.json();
                const nomes = (dados as EstadoIBGE[])
                    .map((e: EstadoIBGE) => e.nome)
                    .sort((a: string, b: string) => a.localeCompare(b));
                setEstados(nomes);
            } catch (erro) {
                console.error("Erro ao buscar estados:", erro);
            }
        };
        buscaEstados();
    }, []);

    // Efeito para fechar o menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                especialidadeRef.current && !especialidadeRef.current.contains(event.target as Node) &&
                localidadeRef.current && !localidadeRef.current.contains(event.target as Node)
            ) {
                setMenuAberto(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []); // Dependências vazias para rodar apenas uma vez na montagem

    const buscaProfissionais = useCallback(async (currentFiltros: Filtros) => {
        setCarregando(true);
        setErro('');
        const params = new URLSearchParams();
        if (currentFiltros.especialidade) params.append('especialidade', currentFiltros.especialidade);
        if (currentFiltros.localidade) params.append('localidade', currentFiltros.localidade);
        if (parseFloat(currentFiltros.valorMaximo) < valorMAXIMO) {
            params.append('valorMaximo', currentFiltros.valorMaximo);
        }
        if (currentFiltros.modalidadeDeAtendimento) {
            params.append('modalidade', currentFiltros.modalidadeDeAtendimento);
        }
        try {
            const res = await api.get(`/profissionais?${params.toString()}`);
            const data = res.data;
            setProfissionais(data.profissionais || data);
            } catch (e: any) {
                setErro(e.message);
                setProfissionais([]);
            } finally {
                setCarregando(false);
            }
        }, []);

    useEffect(() => {
        const newSearchParams = new URLSearchParams();
        if (filtrosForm.especialidade) newSearchParams.set('especialidade', filtrosForm.especialidade);
        if (filtrosForm.localidade) newSearchParams.set('localidade', filtrosForm.localidade);
        if (parseFloat(filtrosForm.valorMaximo) < valorMAXIMO) newSearchParams.set('valorMaximo', filtrosForm.valorMaximo);
        if (filtrosForm.modalidadeDeAtendimento) newSearchParams.set('modalidade', filtrosForm.modalidadeDeAtendimento);
        setSearchParams(newSearchParams, { replace: true });
        buscaProfissionais(filtrosForm);
    }, [filtrosForm, buscaProfissionais, setSearchParams]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFiltrosForm(prev => ({ ...prev, [name]: value }));
    };

    const handleValorMaximoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFiltrosForm(prev => ({ ...prev, valorMaximo: e.target.value }));
    };

    const removerFiltro = (campo: keyof Filtros) => {
        setFiltrosForm(prev => ({
            ...prev,
            [campo]: campo === 'valorMaximo' ? valorMAXIMO.toString() : ''
        }));
    };

    // Filtros ativos para exibição, incluindo valorMaximo se for diferente do padrão
    const filtrosAtivos = Object.entries(filtrosForm).filter(([key, value]) => {
        if (key === 'valorMaximo') {
            return parseFloat(value as string) < valorMAXIMO;
        }
        return value !== '';
    });

    const traduzirFiltro = (key: string): string => {
        const traducoes: { [k: string]: string } = {
            especialidade: 'Especialidade',
            localidade: 'Localidade',
            valorMaximo: 'Valor Máximo',
            modalidadeDeAtendimento: 'Modalidade'
        };
        return traducoes[key] || key;
    };

    const getOpcoesFiltradas = (campo: string, valor: string): string[] => {
        const opcoes = campo === 'especialidade' ? sugestoesIniciais : estados;
        if (!valor) return opcoes;
        return opcoes.filter(op => op.toLowerCase().includes(valor.toLowerCase()));
    };

    const formatarModalidade = (modalidades?: string[]): string => {
        if (!modalidades || modalidades.length === 0) return 'Online'; // Padrão se não houver modalidade
        const temOnline = modalidades.includes('online');
        const temPresencial = modalidades.includes('presencial');
        if (temOnline && temPresencial) return 'Presencial | Online';
        if (temPresencial) return 'Presencial';
        return 'Online';
    };

    const salvarPerfil = async (perfilId: string) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return alert('Você precisa estar logado!');

        await api.post(
            "/usuarios/perfis-salvos",
            { perfilId },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        alert("Perfil salvo com sucesso!");
    } catch (error: any) {
        alert(error.response?.data?.mensagem || error.message);
    }
};


    const [expandirDescricao, setExpandirDescricao] = useState<{ [key: string]: boolean }>({});
    const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const toggleExpandirDescricao = (id: string) => {
        const isCurrentlyExpanded = expandirDescricao[id];
        setExpandirDescricao(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
        if (isCurrentlyExpanded && cardRefs.current[id]) {
            cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="PGProfissionais">
            <div className="container_Filtros">
                <h2>Encontre um Profissional:</h2>
                <div className="container_2">
                    <div className="filtros">
                        <div className="FiltrosInputs">
                            {/* Input de Especialidade com Autocomplete */}
                            <div className="inputContainer" ref={especialidadeRef}> {/* Adicionado ref aqui */}
                                <input
                                    type="text"
                                    name="especialidade"
                                    className="Input_Especialidades"
                                    placeholder="Pesquise uma especialidade de Atendimento:"
                                    value={filtrosForm.especialidade}
                                    onChange={handleInputChange}
                                    onFocus={() => setMenuAberto('especialidade')}
                                    // onBlur removido daqui, o handleClickOutside fará o trabalho
                                />
                                <img
                                    src={setaPrabaixo}
                                    alt="Abrir/Fechar menu"
                                    className="setinha"
                                    onClick={() => setMenuAberto(menuAberto === 'especialidade' ? null : 'especialidade')}
                                />
                                {menuAberto === 'especialidade' && (
                                    <ul className="menuAutocomplete">
                                        {getOpcoesFiltradas('especialidade', filtrosForm.especialidade).map((op, i) => (
                                            <li
                                                key={i}
                                                onClick={() => {
                                                    setFiltrosForm(prev => ({ ...prev, especialidade: op }));
                                                    setMenuAberto(null);
                                                }}
                                            >
                                                {op}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="inputContainer" ref={localidadeRef}>
                                <input
                                    type="text"
                                    name="localidade"
                                    className="Input_Localidade"
                                    placeholder="Selecione uma localidade:"
                                    value={filtrosForm.localidade}
                                    onChange={handleInputChange}
                                    onFocus={() => setMenuAberto('localidade')}
                                />
                                <img
                                    src={setaPrabaixo}
                                    alt="Abrir/Fechar menu"
                                    className="setinha"
                                    onClick={() => setMenuAberto(menuAberto === 'localidade' ? null : 'localidade')}
                                />
                                {menuAberto === 'localidade' && (
                                    <ul className="menuAutocomplete">
                                        {getOpcoesFiltradas('localidade', filtrosForm.localidade).map((op, i) => (
                                            <li
                                                key={i}
                                                onClick={() => {
                                                    setFiltrosForm(prev => ({ ...prev, localidade: op }));
                                                    setMenuAberto(null);
                                                }}
                                            >
                                                {op}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            {/* Select de Modalidade */}
                            <select
                                name="modalidadeDeAtendimento"
                                value={filtrosForm.modalidadeDeAtendimento}
                                onChange={handleInputChange}
                                className="Input_Modalidade"
                            >
                                <option value="online">Somente Online</option>
                                <option value="presencial">Somente Presencial</option>
                            </select>
                        </div>
                        <label htmlFor="" className="labelValorConsulta">Valor Consulta:</label>
                        <div className="inputValorConsulta">
                            <p>R${valorMinimo}</p>
                            <input
                                type="range"
                                min={valorMinimo}
                                max={valorMAXIMO}
                                value={filtrosForm.valorMaximo}
                                onChange={handleValorMaximoChange}
                            />
                            <p>R${filtrosForm.valorMaximo}</p>
                        </div>
                    </div>
                    <div className="filtrosBotoes">
                        <button className="filtroBuscar" onClick={() => buscaProfissionais(filtrosForm)}>
                            Buscar
                            <img src={iconePesquisa} alt="Ícone de pesquisa" className="iconeBuscar" />
                        </button>
                    </div>
                </div>
                <div className="filtrosAdicionados">
                    {filtrosAtivos.map(([key, value]) => (
                        <div className="filtro" key={key}>
                            <h3>{traduzirFiltro(key)}: {key === 'valorMaximo' ? `R$${value}` : value}</h3>
                            <img
                                src={iconedelete}
                                alt="Remover filtro"
                                onClick={() => removerFiltro(key as keyof Filtros)}
                                style={{ cursor: 'pointer' }}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="perfisProfissionais">
                {carregando && <p>Buscando profissionais...</p>}
                {erro && <p className="erro-mensagem">Erro ao carregar: {erro}</p>}
                {profissionais.length > 0 ? (
                    profissionais.map((profissional) => {
                        const fotoPerfilURL = profissional.fotoPerfil
                            ? (profissional.fotoPerfil.startsWith('http')
                                ? profissional.fotoPerfil
                                : `${getMediaBaseUrl()}${profissional.fotoPerfil}`)
                            : fotoProfissionalPadrao;
                        const descricaoExpandida = expandirDescricao[profissional._id] || false;
                        const videoURL = profissional.videoSobreMim && !profissional.videoSobreMim.startsWith('http')
                            ? `${getMediaBaseUrl()}${profissional.videoSobreMim}`
                            : profissional.videoSobreMim;
                        return (
                            <div className="CardProfissionais" key={profissional._id} ref={(el) => { cardRefs.current[profissional._id] = el }}>
                                <div className="container1CardProfissionais">
                                    <div className="fotoPerfilProfissional">
                                        <img
                                            src={fotoPerfilURL}
                                            alt={`Foto de ${profissional.nome}`}
                                        />
                                    </div>
                                    <div className="enderecoTexto">
                                        <p><span>Atende:</span> <br />{formatarModalidade(profissional.infoProfissional?.modalidadeDeAtendimento)}</p>
                                        <hr />
                                        <p>
                                            {profissional.infoProfissional?.enderecoConsultorio && (
                                                <>
                                                    <span style={{ fontWeight: 'bold' }}>Endereço do consultório:</span>
                                                    <br />
                                                    {profissional.infoProfissional.enderecoConsultorio}
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="infoProfissional">
                                    <div className="containerSalvarPerfil">
                                        <div className="salvarPerfil">
                                            <button
                                                className="botaoSalvarPerfil"
                                                onClick={() => salvarPerfil(profissional._id)}
                                            >
                                                Salvar
                                            </button>
                                            <img src={iconeSalvar} alt="Ícone de salvar" className="iconeSalvarPerfil" />
                                        </div>
                                    </div>
                                    <h2>
                                        {profissional.nome} <br />{profissional.infoProfissional?.profissao || 'Profissional'}
                                    </h2>
                                    <p>CRP {profissional.infoProfissional?.crp || 'Não informado'}</p>
                                    {profissional.videoSobreMim ? (
                                        <div className="videoResumoCard">
                                            <h3>Vídeo de Apresentação: </h3>
                                            <video
                                                src={videoURL}
                                                controls
                                                className="displayVideoProfissionalCard"
                                                width="100%"
                                                height="200"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <h3>Sobre mim:</h3>
                                            <div className="textoProfissional">
                                                <p
                                                    className={`descricao-texto ${descricaoExpandida ? 'expandido' : 'colapsado'}`}
                                                >
                                                    {profissional.descricao
                                                        || 'O profissional ainda não adicionou uma descrição.'}
                                                </p>
                                                {profissional.descricao && profissional.descricao.length > 150 && (
                                                    <button
                                                        className="verMaisDescricao"
                                                        onClick={() => toggleExpandirDescricao(profissional._id)}
                                                    >
                                                        {descricaoExpandida ? 'Ver menos...' : 'Ver mais...'}
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    <p><Link className="linkPerfilProf" to={`/perfil/${profissional._id}`}>Ver perfil completo</Link></p>
                                    <div className="infoAdicionais">
                                        <div className="estrelinhasAvaliacao">
                                            <img
                                                className="FotoavaliacaoDeletar"
                                                src={fotoESTRELAFUTURAMENTEDELETAR} alt="Avaliação por estrelas" />
                                        </div>
                                        <p>R${profissional.infoProfissional?.valorConsulta || 0}</p>
                                        <p>
                                            {profissional.infoProfissional?.duracaoConsulta
                                                ? `${profissional.infoProfissional.duracaoConsulta} min`
                                                : 'Duração não informada'}
                                        </p>
                                    </div>
                                </div>
                                <div className="componenteCalendario">
                                    <Agenda
                                        profissionalId={profissional._id}
                                        modalidade={(profissional.infoProfissional?.modalidadeDeAtendimento?.[0] || 'Online') as ('Online' | 'Presencial')}
                                    />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    !carregando && !erro && <p className="nenhum-profissional">Nenhum profissional encontrado com os filtros selecionados.</p>
                )}
            </div>
        </div>
    );
};

export default Profissionais;
