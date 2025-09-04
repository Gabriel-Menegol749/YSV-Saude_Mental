import React from "react";
import { Link, useLocation } from 'react-router-dom';
import './Cabecalho.css';
import logoYSV from '../assets/logoNomYSV.png'
import logoNotific from '../assets/bell-svgrepo-com (1).svg'
import logoPerfil from '../assets/profile-circle-svgrepo-com.svg'
import logoMess from '../assets/message-bubble-2-svgrepo-com.svg'

const Cabecalho = () => {
    const location = useLocation();
    const paginaSobre = location.pathname ==='/sobre';
    const linkSobreOuInicio = paginaSobre ? (
        <li><Link to ="/">Início</Link></li>
    ) : (
        <li><Link to="/sobre">Sobre</Link></li>
    )
    return(
        <header className='main-header'>
            <div className="container">
            <div className="containerEsquerda">

                    <Link to='/' className="logo">
                        <img src={logoYSV} alt="" className="logoYSV" />
                    </Link>
                <nav className="Links">
                    <ul>
                        {linkSobreOuInicio}
                        <li><Link to="/">Agendamentos</Link></li>
                        <li><Link to="/profissionais">Encontre um Profissional</Link></li>
                        <li><Link to="/autenticacao">Para Profissionais</Link></li>
                    </ul>
                </nav>
            </div>

            <div className="containerDireita">
                <nav>
                    <ul>
                        <li><img src={logoMess} alt="Ícone de Mensagens" className="logoMess"/></li>
                        <li><img src={logoNotific} alt="Ícone de Notificações" className="LogoNot"/></li>
                        <li><img src={logoPerfil} alt="Ícone de Perfil" className="LogoPerf"/></li>
                    </ul>
                </nav>
            </div>
        </div>
        </header>
    )
}

export default Cabecalho;