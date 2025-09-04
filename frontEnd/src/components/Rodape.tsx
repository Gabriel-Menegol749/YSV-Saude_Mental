import React from "react";
import './Rodape.css'
import fotoYSV from '../assets/logoYSV.png'
import insta from '../assets/instagram-svgrepo-com.svg'
import face from '../assets/facebook-boxed-svgrepo-com.svg'
import whats from '../assets/whatsapp-svgrepo-com.svg'
import linkedin from '../assets/linkedin-svgrepo-com.svg'

const Rodape = () => {
    return (
        <footer className="rodaPE">
            <div className="seccaoFooter">
                <h1>YSV - Saúde Mental</h1>
                <p>Cuidado Adequado  Para Saúde e Bem-Estar</p>
            </div>

            <div className="redesSociais">
                <img src={fotoYSV} alt="" className="fotologo"/>
                <h1>Entre em contato</h1>
                    <nav>
                        <ul>
                            <li><img src={whats} alt="" /></li>
                            <li><img src={insta} alt="" /></li>
                            <li><img src={face} alt="" /></li>
                            <li><img src={linkedin} alt="" /></li>
                        </ul>
                    </nav>
            </div>

            <div className="linksPolitcs">
                <p>Copyright 2025 © Projeto YSV - Saúde Mental</p>
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
