import {useEffect, useState, useCallback} from "react";
import { Link, useSearchParams } from "react-router-dom";
import Agenda from "../components/Agenda";
import iconefiltro from '../assets/iconeFiltro.png';
import iconedelete from '../assets/icone-deleta.png';
import setaPrabaixo from '../assets/seta-PraBaixo.png';
import iconePesquisa from '../assets/search.png';
import iconeSalvar from '../assets/salve.png';
import fotoProfissional from '../assets/profile-circle-svgrepo-com.svg';
import './Profissionais.css'

interface ProfissionalCard {
    _id: string;
    nome: string;
    fotoPerfil?: string;
    infoProfissional:{
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
const API_BASE_URL = 'http://localhost:5000'; // ✅ CORREÇÃO: No topo

const Profissionais = () =>{
    const [profissionais, setProfissionais] = useState<ProfissionalCard[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string>('');
    const[searchParams, setSearchParams] = useSearchParams();
    const[filtrosForm, setFiltrosForm] = useState<Filtros>({
        especialidade: searchParams.get('especialidade') || '',
        localidade: searchParams.get('localidade') || '',
        valorMaximo: searchParams.get('valorMaximo') || valorMAXIMO.toString(),
        modalidadeDeAtendimento: searchParams.get('modalidade') || '',
    })

    const [menuAberto, setMenuAberto] = useState<string | null>(null);
    const [sideBarFiltros, setSideBarFiltros] = useState(false);
    const [estados, setEstados] = useState<string[]>([]);

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
            try{
                const resposta = await fetch(
                    "https://servicodados.ibge.gov.br/api/v1/localidades/estados"
                );
                const dados = await resposta.json();
                const nomes = (dados as EstadoIBGE[])
                    .map((e: EstadoIBGE) => e.nome)
                    .sort((a: string, b: string) => a.localeCompare(b));
                setEstados(nomes);
            } catch(erro){
                console.error("Erro ao buscar estados:", erro);
            }
        };
        buscaEstados();
    }, []);

    const buscaProfissionais = useCallback(async (currentFiltros: Filtros) => {
        setCarregando(true);
        setErro('');
        const params = new URLSearchParams();

        if(currentFiltros.especialidade) params.append('especialidade', currentFiltros.especialidade);
        if(currentFiltros.localidade) params.append('localidade', currentFiltros.localidade);
        if(parseFloat(currentFiltros.valorMaximo) < valorMAXIMO){
            params.append('valorMaximo', currentFiltros.valorMaximo);
        }
        if(currentFiltros.modalidadeDeAtendimento) {
            params.append('modalidade', currentFiltros.modalidadeDeAtendimento);
        }

        try{
            const url = `${API_BASE_URL}/api/profissionais?${params.toString()}`;
            const res = await fetch(url);
            const data = await res.json();
            if(!res.ok){
                throw new Error(data.mensagem || "Falha ao buscar profissionais.");
            }
            setProfissionais(data.profissionais || data);
        } catch(e: any){
            setErro(e.message);
            setProfissionais([]);
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        const newSearchParams = new URLSearchParams();
        if(filtrosForm.especialidade) newSearchParams.set('especialidade', filtrosForm.especialidade);
        if(filtrosForm.localidade) newSearchParams.set('localidade', filtrosForm.localidade);
        if(parseFloat(filtrosForm.valorMaximo) < valorMAXIMO) newSearchParams.set('valorMaximo', filtrosForm.valorMaximo);
        if(filtrosForm.modalidadeDeAtendimento) newSearchParams.set('modalidade', filtrosForm.modalidadeDeAtendimento);

        setSearchParams(newSearchParams, { replace: true });
        buscaProfissionais(filtrosForm);
    }, [filtrosForm, buscaProfissionais, setSearchParams]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const{ name, value } = e.target;
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

    const filtrosAtivos = Object.entries(filtrosForm).filter(([key, value]) => {
        if (key === 'valorMaximo') return false;
        return value !== '';
    });

    const traduzirFiltro = (key: string): string => {
        const traducoes: {[k: string]: string} = {
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

    // ✅ NOVA FUNÇÃO: Formata modalidade de atendimento
    const formatarModalidade = (modalidades?: string[]): string => {
        if (!modalidades || modalidades.length === 0) return 'Online';

        const temOnline = modalidades.includes('online');
        const temPresencial = modalidades.includes('presencial');

        if (temOnline && temPresencial) return 'Presencial | Online';
        if (temPresencial) return 'Presencial';
        return 'Online';
    };

    const salvarPerfil = async (perfilId: string) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
        alert('Você precisa estar logado para salvar perfis!');
        return;
        }

        const res = await fetch(`${API_BASE_URL}/api/usuarios/perfis-salvos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ perfilId }),
        });

        const data = await res.json();

        if (!res.ok) {
        throw new Error(data.mensagem || 'Falha ao salvar perfil.');
        }

        alert('Perfil salvo com sucesso!');
    } catch (error: any) {
        alert(error.message);
    }
    };


    return(
        <div className="PGProfissionais">
            <div className="container_Filtros">
                <h2>Encontre um Profissional:</h2>
                <div className="container_2">
                    <div className="filtros">
                        <div className="FiltrosInputs">
                            {/* Input de Especialidade com Autocomplete */}
                            <div className="inputContainer">
                                <input
                                    type="text"
                                    name="especialidade"
                                    className="Input_Especialidades"
                                    placeholder="Pesquise uma especialidade de Atendimento:"
                                    value={filtrosForm.especialidade}
                                    onChange={handleInputChange}
                                    onFocus={() => setMenuAberto('especialidade')}
                                />
                                <img 
                                    src={setaPrabaixo} 
                                    alt="" 
                                    className="setinha"
                                    onClick={() => setMenuAberto(menuAberto === 'especialidade' ? null : 'especialidade')}
                                />

                                {menuAberto === 'especialidade' && (
                                    <ul className="menuAutocomplete">
                                        {getOpcoesFiltradas('especialidade', filtrosForm.especialidade).map((op, i) => (
                                            <li 
                                                key={i}
                                                onClick={() => {
                                                    setFiltrosForm(prev => ({...prev, especialidade: op}));
                                                    setMenuAberto(null);
                                                }}
                                            >
                                                {op}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Input de Localidade com Autocomplete */}
                            <div className="inputContainer">
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
                                    alt="" 
                                    className="setinha"
                                    onClick={() => setMenuAberto(menuAberto === 'localidade' ? null : 'localidade')}
                                />

                                {menuAberto === 'localidade' && (
                                    <ul className="menuAutocomplete">
                                        {getOpcoesFiltradas('localidade', filtrosForm.localidade).map((op, i) => (
                                            <li 
                                                key={i}
                                                onClick={() => {
                                                    setFiltrosForm(prev => ({...prev, localidade: op}));
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
                                <option value="">Online e Presencial</option>
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
                            <img src={iconePesquisa} alt="" className="iconeBuscar"/>
                        </button>
                        <button className="maisFiltros" onClick={() => setSideBarFiltros(!sideBarFiltros)}>
                            Mais Filtros
                            <img src={iconefiltro} alt="" className="iconeFiltro" />
                        </button>
                    </div>
                </div>

                <div className="filtrosAdicionados">
                    {filtrosAtivos.map(([key, value]) => (
                        <div className="filtro" key={key}>
                            <h3>{traduzirFiltro(key)}: {key === 'valorMaximo' ? `R$${value}` : value}</h3>
                            <img 
                                src={iconedelete} 
                                alt="Remover" 
                                onClick={() => removerFiltro(key as keyof Filtros)}
                                style={{cursor: 'pointer'}}
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
                        // ✅ CORREÇÃO: const FORA do return
                        const fotoPerfilURL = profissional.fotoPerfil
                            ? (profissional.fotoPerfil.startsWith('http')
                                ? profissional.fotoPerfil
                                : `${API_BASE_URL}${profissional.fotoPerfil}`)
                            : fotoProfissional;

                        return (
                            <div className="CardProfissionais" key={profissional._id}>
                                <div className="container1CardProfissionais">
                                    <img
                                        src={fotoPerfilURL}
                                        alt={`Foto de ${profissional.nome}`}
                                        className="fotoPerfilProfissional"
                                    />
                                    <div className="enderecoTexto">
                                        <p>{formatarModalidade(profissional.infoProfissional?.modalidadeDeAtendimento)}</p>
                                        <hr />
                                        <p>{profissional.infoProfissional?.enderecoConsultorio || 'Atendimento Online'}</p>
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
                                            <img src={iconeSalvar} alt="" className="iconeSalvarPerfil" />
                                        </div>
                                    </div>

                                    <h2>
                                        {profissional.nome} | {profissional.infoProfissional?.profissao || 'Profissional'}
                                    </h2>

                                    <p>CRP {profissional.infoProfissional?.crp || 'Não informado'}</p>

                                    <h3>Sobre mim:</h3>
                                    <div className="textoProfissional">
                                        <p>{profissional.infoProfissional?.descricao || 'O profissional ainda não adicionou uma descrição.'}</p>
                                    </div>

                                    <p><Link to={`/perfil/${profissional._id}`}>Ver perfil completo</Link></p>

                                    <div className="infoAdicionais">
                                        <div className="estrelinhasAvaliacao"></div>
                                        <p>R${profissional.infoProfissional?.valorConsulta || 0}</p>

                                        <p>
                                            {profissional.infoProfissional?.duracaoConsulta 
                                                ? `${profissional.infoProfissional.duracaoConsulta} min` 
                                                : 'Duração não informada'}
                                        </p>
                                    </div>
                                </div>

                                <div className="componenteCalendario">
                                    <Agenda profissionalId={profissional._id} />
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
