import {useEffect, useState, useCallback} from "react";
import { useSearchParams } from "react-router-dom";
import iconefiltro from '../assets/iconeFiltro.png'
import iconedelete from '../assets/icone-deleta.png'
import setaPrabaixo from '../assets/seta-PraBaixo.png'
import iconePesquisa from '../assets/search.png'
import './Profissionais.css'

interface ProfissionalCard {
    _id: string;
    nome: string;
    fotoPerfil?: string;
    infoProfissional:{
        crp?: string;
        especialidades?: string[];
        valorConsulta?: number;
        enderecoConsultorio?: string,
        descricao?: string;
    };
}

interface Filtros {
    especialidade: string,
    localidade: string,
    convenio: string,
    valorMaximo: string;
}

const valorMinimo = 50;
const valorMAXIMO = 500;

const Profissionais = () =>{
    const [profissionais, setProfissionais] = useState<ProfissionalCard[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string>('');

    const[searchParams, setSearchParams] = useSearchParams();

    const[filtrosForm, setFiltrosForm] = useState<Filtros>({
        especialidade: searchParams.get('especialidade') || '',
        localidade: searchParams.get('localidade') || '',
        convenio: searchParams.get('convenio') || '',
        valorMaximo: searchParams.get('valorMaximo') || valorMAXIMO.toString(),
    })

    const [menuAberto, setMenuAberto] = useState(null);
    const [sideBarFiltros, setSideBarFiltros] = useState(false);
    const [estados, setEstados] = useState<string[]>([]);


    //Constante de Especialidades, comuns e digitados a mão
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

    //Constante de Convênios, comuns e digitados a mão
    const convenios = [
        "Unimed", "Cassi", "SulAmérica", "Bradesco Saúde", "IPÊ Saúde", "Amil", "Particular",]

    //Constantes das opções dos menus que devem aparecer nos inputs
    const opcoes = {
        especialidade: sugestoesIniciais,
        estado: estados,
        convenio: convenios
    }

    //Busca estados usando api do ibges
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
        if(currentFiltros.valorMaximo && parseFloat(currentFiltros.valorMaximo) < valorMAXIMO){
            params.append('valorMaximo', currentFiltros.valorMaximo);
        }
        if(currentFiltros.convenio) params.append('convenio', currentFiltros.convenio);

        try{
            const url = `http://localhost:5000/api/profissionais?${params.toString()}`;
            const res = await fetch(url);
            const data = await res.json();

            if(!res.ok){
                throw new Error(data.msg || "Falha ao buscar profissionais.");
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
        if(filtrosForm.convenio) newSearchParams.set('convenio', filtrosForm.convenio);
        if(parseFloat(filtrosForm.valorMaximo) < valorMAXIMO) newSearchParams.set('valorMaximo', filtrosForm.valorMaximo);
        setSearchParams(newSearchParams, { replace: true });

        buscaProfissionais(filtrosForm);
    }, [filtrosForm, buscaProfissionais, setSearchParams]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const{ name, value } = e.target;
        setFiltrosForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    }

    return(
        <div className="PGProfissionais">
            <div className="container_Filtros">
                <h2>Encontre um Profissional:</h2>
                <div className="container_2">
                    <div className="filtros">
                        <div className="FiltrosInputs">

                            {/*Container do input de Especialidade*/}
                            <div className="inputContainer">
                                <input type="text" className="Input_Especialidades" placeholder="Pesquise uma especialidade de Atendimento:"/>
                                <img src={setaPrabaixo} alt="" className="setinha"/>
                            </div>

                            {/*Container do input de localidade*/}
                            <div className="inputContainer">
                                <input type="text" className="Input_Localidade" placeholder="Selecione uma localidade:"/>
                                <img src={setaPrabaixo} alt="" className="setinha"/>
                            </div>
                            {/*Container do input de Convênio*/}
                            <div className="inputContainer">
                                <input type="text" className="Input_Convênio" placeholder="Convênio" />
                                <img src={setaPrabaixo} alt="" className="setinha"/>
                            </div>
                        </div>
                        <label htmlFor="" className="labelValorConsulta">Valor Consulta:</label>
                        <div className="inputValorConsulta">
                            <p>R$50</p>
                            <input type="range" />
                            <p>R$500</p>
                        </div>
                    </div>
                    {/*Botões dos filtros, o mais filtros abrirá um menu que permitirá que mais filtros sejam adicionados */}
                    <div className="filtrosBotoes">
                        <button className="filtroBuscar">
                            Buscar
                            <img src={iconePesquisa} alt="" className="iconeBuscar"/>
                            </button>
                        <button className="maisFiltros">
                            Mais Filtros
                            <img src={iconefiltro} alt="" className="iconeFiltro" />
                        </button>
                    </div>
                </div>

                {/*Tags de filtros que foram adicionados*/}
                <div className="filtrosAdicionados">
                    <div className="filtro">
                        <h3>filtro 1</h3>
                        <img src={iconedelete} alt="" />
                    </div>
                    <div className="filtro">
                        <h3>filtro 1</h3>
                        <img src={iconedelete} alt="" />
                    </div>
                    <div className="filtro">
                        <h3>filtro 1</h3>
                        <img src={iconedelete} alt="" />
                    </div>
                </div>
            </div>

            <div className="CardProfissionais">
                <h1>
                    insira aqui, configurações incríveis sobre os profissionais
                </h1>
            </div>
            <div className="CardProfissionais">
                <h1>
                    insira aqui, configurações incríveis sobre os profissionais
                </h1>
            </div>
            <div className="CardProfissionais">
                <h1>
                    insira aqui, configurações incríveis sobre os profissionais
                </h1>
            </div>
        </div>
    );
};

export default Profissionais;