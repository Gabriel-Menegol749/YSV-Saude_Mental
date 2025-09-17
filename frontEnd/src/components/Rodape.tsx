import React from "react";
import './Rodape.css'
import fotoYSV from '../assets/logoYSV.png'
import whats from '../assets/whatsapp-svgrepo-com.svg'
import linkedin from '../assets/linkedin-svgrepo-com.svg'
import github from '../assets/github.svg';
import gmail from '../assets/gmail.svg'


const Rodape = () => {
    return (
        <footer className="rodaPE">
            <div className="seccaoFooter">
                <h1 className="tituloRodape">YSV - Saúde Mental</h1>
                <p className="slogan">Cuidado Adequado  Para Saúde e Bem-Estar</p>
            </div>

            <div className="redesSociais">
                <img src={fotoYSV} alt="" className="fotologo"/>
                <h1>Entre em contato!</h1>
                    <nav>
                        <ul>
                            <li><img src={whats} alt="" className="muda-cor-tema"/></li>
                            <li><img src={linkedin} alt="" className="muda-cor-tema"/></li>
                            <li> <img src={gmail} alt="" className="muda-cor-tema"/></li>
                            <li><img src={github} alt="" className="muda-cor-tema"/></li>
                        </ul>
                    </nav>
            </div>

            <div className="linksPolitcs">
                <p className="copyright">Copyright 2025 © Projeto YSV - Saúde Mental</p>
                <div className="politics">
                    <a href="">Politica de Privacidade</a>
                    <p>|</p>
                    <a href="">Termos de Condições</a>
                </div>
            </div>

        </footer>
    )
}

export default Rodape;
