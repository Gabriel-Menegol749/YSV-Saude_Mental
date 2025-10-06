import React, { useState, useEffect, type ChangeEvent } from 'react';
import { Link, useNavigate } from "react-router-dom";
import '../pagesCSS/HomePage.css';
import foto1PROF from '../assets/fotoProf_primeiraPg_.png';
import foto2PROF from '../assets/fotoProfissional2.png'
import foto3PROF from '../assets/profissionalePaciente.png'
import lupaDPesquisa from '../assets/lupadPisquisaCinza.png';
import setaDireita from '../assets/setaDireita.png'
import setaEsquerda from '../assets/setaEsquerda.png'

//Sugestões da Barra de Pesquisa (implementar futuramente pesquisas anteriores, estilo google)
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
//Imports das imagens dos Banners, código mais abaixo
import AbusoDrogas from '../assets/fotosCardsHomepage/abusodDrogas_card.png'
import AnsiedadeStress from '../assets/fotosCardsHomepage/ansiedadeStress_card.jpg'
import BurnOut from '../assets/fotosCardsHomepage/burnOut_card.jpg'
import Depressao from '../assets/fotosCardsHomepage/depressao_card.jpg'
import DesenvolvimentoPessoal from '../assets/fotosCardsHomepage/desenvolvimentoPessoal_card.jpg'
import Diagnostico from '../assets/fotosCardsHomepage/diagnostico_card.jpg'
import Luto from '../assets/fotosCardsHomepage/Luto_card.jpg'
import OrientacaoProfissional from '../assets/fotosCardsHomepage/orientacaoProfissional_card.jpg'
import QuestoesDRelacionamentoFamiliar from '../assets/fotosCardsHomepage/QuestoesDGenero_card.png'
import QuestoesDGeneroEOrientacaoSexual from '../assets/fotosCardsHomepage/questoesRelacionamentoFamiliar_card.jpg'
import Sono from '../assets/fotosCardsHomepage/sono_Card.jpg'
import TDAH from '../assets/fotosCardsHomepage/tdha_NeuroDesenvolvimento_card.jpg'
import TranstornoAlimentar from '../assets/fotosCardsHomepage/transtornoAlimentar_card.jpg'
import TranstornoDHumor from '../assets/fotosCardsHomepage/transtornoDHumor_card.jpg'
import TranstornoDRaiva from '../assets/fotosCardsHomepage/transtornoDRaiva_card.jpg'

//import dos cards das categorias
const categoriasCarrossel = [
    {nome: 'Ansiedade', filtro: 'Ansiedade e Estresse', imagem: AnsiedadeStress},
    {nome: 'Estresse no Ambiente de Trabalho e BurnOut', filtro: 'Estresse no Ambiente de Trabalho e BurnOut', imagem: BurnOut},
    {nome: 'Depressão e Tristeza Profunda', filtro: 'Depressão e Tristeza Profunda', imagem: Depressao},
    {nome: 'Desenvolvimento Pessoal', filtro: 'Desenvolvimento Pessoal', imagem: DesenvolvimentoPessoal},
    {nome: 'Avaliação Psicológica e Diagnóstico', filtro: 'Avaliação Psicológica e Diagnóstico', imagem: Diagnostico},
    {nome: 'Luto e Perdas', filtro: 'Luto e Perdas', imagem: Luto},
    {nome: 'Desenvolvimento Profissional e Orientação', filtro: 'Desenvolvimento Profissional e Orientação', imagem: OrientacaoProfissional},
    {nome: 'Questões de Relacionamento e Familiares', filtro: 'Questões de Relacionamento e Familiares', imagem: QuestoesDGeneroEOrientacaoSexual},
    {nome: 'Questões Sobre Gênero e Orientação Sexual', filtro: 'Questões Sobre Gênero e Orientação Sexual', imagem: QuestoesDRelacionamentoFamiliar},
    {nome: 'Problemas com Sono e Insônia', filtro: 'Problemas com Sono e Insônia', imagem: Sono},
    {nome: 'Transtorno de Déficit de Atenção com Hiperatividade', filtro: 'TDAH', imagem: TDAH},
    {nome: 'Transtornos Alimentares', filtro: 'Transtornos Alimentares', imagem: TranstornoAlimentar},
    {nome: 'Transtornos e Alterações de Humor', filtro: 'Transtornos e Alterações de Humor', imagem: TranstornoDHumor},
    {nome: 'Transtornos com Raiva e Temperamento', filtro: 'Transtornos com Raiva e Temperamento', imagem: TranstornoDRaiva},
    {nome: 'Abuso de Substancias Químicas e Vícios', filtro: 'Abuso de Substancias Químicas e Vícios', imagem: AbusoDrogas},

]

//imports das logos da pg sobre
import acessibilidadeLogo from '../assets/logoMentalHealth.png';
import profssionalLogo from '../assets/logoProfissional.png';
import agendamentoCalendarioLogo from '../assets/logoCalendario.png';

const HomePage = () =>{
    const navigate = useNavigate();

    //Constantes e configurações do input de pesquisa
    const [inputValue, setInputValue] = useState('');
    const [sugestoesPesquisa, setSugestoesPesquisa] = useState<string[]>([]);
    const [historicoPesquisa, setHistoricoPesquisa] = useState<string[]>([]);

    useEffect(() => {
        const saveHistorico = localStorage.getItem('ysv_historicod_pesquisa');
        if(saveHistorico){
            setHistoricoPesquisa(JSON.parse(saveHistorico));
        }
    }, []);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const valor = event.target.value;
        setInputValue(valor);

        if(valor.length > 0){
            const sugestoesFiltradas = sugestoesIniciais.filter(s => s.toLowerCase().includes(valor.toLowerCase()));
        setSugestoesPesquisa(sugestoesFiltradas);

        } else {
            const sugestoesComHistorico = historicoPesquisa.concat(
                sugestoesIniciais.filter(s => !historicoPesquisa.includes(s))
            );
            setSugestoesPesquisa(sugestoesComHistorico);
        }
    }

    const handleInputFocus = () => {
        if(inputValue.length === 0){
            const sugestoesComHistorico = historicoPesquisa.concat(
                sugestoesIniciais.filter(s => !historicoPesquisa.includes(s))
            );
            setSugestoesPesquisa(sugestoesComHistorico);
        }
    }
    const handleInputBlur = () => {
        setTimeout(() => {
            setSugestoesPesquisa([]);
        }, 150);
    }
    const handleSugestaoClick = (sugestao: string) => {
        setInputValue(sugestao);
        setSugestoesPesquisa([]);

        const novoHistorico = [sugestao, ...historicoPesquisa.filter(s => s !== sugestao)].slice(0, 5);
        setHistoricoPesquisa(novoHistorico);
        localStorage.setItem('ysv_historicod_pesquisa', JSON.stringify(novoHistorico));
        navigate(`/Profissionais?filtro=${encodeURIComponent(sugestao)}`);
    }

    const handlePesquisanoEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if(event.key === 'Enter' && inputValue.trim().length > 0){
            const novoHistorico = [inputValue.trim(), ...historicoPesquisa.filter(s => s !== inputValue.trim())].slice(0, 5);
            setHistoricoPesquisa(novoHistorico);
            localStorage.setItem('ysv_historicod_pesquisa', JSON.stringify(novoHistorico));
            navigate(`/Profissionais?filtro=${encodeURIComponent(inputValue.trim())}`);

            setInputValue('');
            setSugestoesPesquisa([]);
        }
    }

    //Constantes e Configurações dos banners
    const [paginaAtual, setPaginaAtual] = useState(0);
    const BANNERS_POR_PAGINA = 5;

    const totalPaginas = Math.ceil(categoriasCarrossel.length / BANNERS_POR_PAGINA);
    const rolarEsquerda = paginaAtual > 0;
    const rolarDireita = paginaAtual < totalPaginas - 1;

    const scrollEsquerda = () => {
        setPaginaAtual((prev) => Math.max(prev -1, 0));
    }
    const scrollDireita = () => {
        setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas -1));
    }
    return(
        <div>
            <div className="tela1">
                <div className="apresentacao">
                    <h1>Seja Bem-Vindo(a) a YSV!</h1>
                    <hr />
                    <p>A YSV é a plataforma onde a sua saúde mental encontra o profissional certo. Oferecemos um espaço seguro e acolhedor para que você possa agendar consultas com psicólogos e psiquiatras e dar o próximo passo rumo ao bem-estar.</p>
                    <Link to="/Profissionais" className="buttonConhecaProf">Conheça nossos Profissionais</Link>
                </div>
                <div className="imgProf1"><img src={foto1PROF} alt="" /></div>
            </div>

            {/*Configuração da tela de pesquisa e apresentação de categorias de Atendimentos*/}
            <div className="tela2">
                <div className="divDPesquisa">
                    <h2>Aqui você pode  encontrar profissionais especializados em diversas <br/>áreas da Saúde Mental!</h2>
                    <div className="campoPesquisa">
                        <div className="inputPesq">
                            <label htmlFor="buscaCategoria">
                                <img src={lupaDPesquisa} alt="" />
                            </label>
                            {/*Configurações do input de pesquisa e do menu de sugestoes de pesquisa*/}
                            <input
                            type="text" className="buscaCategoria" id="buscaCategoria"
                            placeholder="Pesquise as especialidades que você precisa!"
                            value={inputValue}
                            onChange={handleInputChange}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            onKeyDown={handlePesquisanoEnter}
                            autoComplete='off'
                            />
                            {sugestoesPesquisa.length > 0 && (
                                    <ul className="sugestoesMenu">
                                        {sugestoesPesquisa.map((sugestao, index) => (
                                            <li key={index} onClick={() => handleSugestaoClick(sugestao)}>
                                                {sugestao}
                                            </li>
                                        ))}
                                    </ul>
                            )}
                        </div>
                    </div>
            </div>

            {/*Configurações dos banners das categorias de atendimento do site*/}
            <div className="containerCategorias">

            {/*Botão na posição relativa, que permite a navegação para*/}
                    <button className="botaoCarrossel_Esquerda"
                            onClick={scrollEsquerda}
                            style={{opacity: rolarEsquerda ? 1 : 0, pointerEvents: rolarEsquerda ? 'auto' : 'none'}}>
                                <img src={setaEsquerda}  alt="Seta para Esquerda" className="icone-setaCarrossel"/>
                    </button>

                    {/*Cards de categorias*/}
                    <div
                        className='faixaCategorias'
                        style={{
                        width: `${totalPaginas * 100}%`,
                        transform: `translateX(-${paginaAtual * 100}%)`,
                        transition: "transform 0.5s ease"
                    }}>

                    {categoriasCarrossel.map((item, index) => (
                            <div
                                key={index}
                                className='categ'
                                style={{
                                    backgroundImage: `url(${item.imagem})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                                onClick={() => navigate(`/Profissionais?filtro=${encodeURIComponent(item.filtro)}`)}>
                                <div className="tituloCategoria">{item.nome}</div>
                            </div>
                        ))}
                    </div>
                    <button className="botaoCarrossel_Direita"
                            onClick={scrollDireita}
                            style={{opacity: rolarDireita ? 1 : 0, pointerEvents: rolarDireita ? 'auto' : 'none'}}>
                        <img src={setaDireita} alt="Seta para Direita" className="icone-setaCarrossel"/>
                    </button>
            </div>
            </div>

            {/*Configurações da tela 3, trabalhe conosco*/}
            <div className="tela3">
                <div className="cabecalho_TrabConosoco">
                    <h1>Trabalhe Conosco!</h1>
                </div>
                <div className="trabalheConosco">
                    <div className="fotoProf2"><img src={foto2PROF} alt="" /></div>
                    <div className="textoTrabConosco">
                        <h1>Junte-se à YSV e leve seu trabalho para um novo patamar!</h1>
                        <hr/>
                            <p>Cadastre-se, organize sua agenda, conecte-se com pacientes de forma
                            segura e pratique sua profissão com liberdade e confiança. Aqui, você
                            faz a diferença na vida das pessoas e ainda cresce profissionalmente</p>
                        <Link to="/AutenticacaoPage" className="LinkTrabalheConosco">Registre-se como profissional</Link>
                    </div>
                </div>
            </div>

            {/*Tela 4, um resuminho sobre meu sistema*/}
            <div className="tela4">
                <div className="cabecalhoSobre">
                    <h1>Sobre a Plataforma YSV!</h1>
                </div>
                <div className="seccaoSobre">
                    <div className="sobreTextos">
                        <p>Na YSV, você encontra profissionais de saúde mental de forma rápida,
                            segura e sem complicação. Nossa plataforma foi criada pra facilitar
                            sua jornada em busca de bem-estar e qualidade de vida.
                        </p>
                        <hr />
                        <ul className='ListaSobre'>
                            <li>
                                <img src={acessibilidadeLogo} alt="" />
                                <p>Acesso fácil a serviços psicológicos e psiquiátricos de qualidade</p>
                            </li>
                            <li>
                                <img src={profssionalLogo} alt="" />
                                <p>Especialistas qualificados em diversas áreas</p>
                            </li>
                            <li>
                                <img src={agendamentoCalendarioLogo} alt="" />
                                <p>Agendamento de consutas fácil e rápido</p>
                            </li>
                        </ul>
                        <Link to="/Sobre" className='linkSobreYSV'>Conheça mais sobre a gente!</Link>
                    </div>
                    <img src={foto3PROF} alt="" />
                </div>
            </div>
        </div>
    )
}

export default HomePage;
