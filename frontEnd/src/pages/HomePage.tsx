import { Link } from "react-router-dom";
import '../pagesCSS/HomePage.css';
import lupaDPesquisa from '../assets/lupadPisquisaCinza.png'
import foto1PROF from '../assets/fotoProf_primeiraPg_.png';
const HomePage = () =>{
    return(
        <div>
            <div className="tela1">
                <div className="apresentacao">
                    <h1>Seja Bem-Vindo(a) a YSV!</h1>
                    <hr/>
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
                        <img src={lupaDPesquisa} alt="" />
                        <input type="text" className="buscaCategoria" placeholder="Pesquise as especialidades que você precisa!"/>
                    </div>
                </div>
            </div>

            <div className="categoriasDAtendimento">
                <div className="categ"></div>
                <div className="categ"></div>
                <div className="categ"></div>
                <div className="categ"></div>
                <div className="categ"></div>
                </div>
            </div>
            <div className="tela3">
                <h3>alguma coisa</h3>
            </div>
            <div className="header3">
                <h1>Conheça os profissionais do nosso sistema!</h1>
            </div>

            <div className="header4">
                <h1>Trabalhe conosco</h1>
            </div>

            <div className="header5">
                <h1>Sobre a YSV</h1>
            </div>
        </div>
    )
}

export default HomePage;