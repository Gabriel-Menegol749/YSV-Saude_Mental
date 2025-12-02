import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Cabecalho.css';
import logoYSV from '../assets/logoNomYSV.png';
import logoNotific from '../assets/notificacao.png';
import logoPerfil from '../assets/profile-circle-svgrepo-com.svg';
import logoMess from '../assets/mensagensIcon.svg';
import { useAuth } from '../contextos/ContextoAutenticacao';
import api from '../services/api.ts'

const getMediaBaseUrl = () => {
    const currentBaseUrl = api.defaults.baseURL || '';
    if (currentBaseUrl.endsWith('/api')) {
        return currentBaseUrl.substring(0, currentBaseUrl.length - 4);
    }
    return currentBaseUrl;
};

const Cabecalho = ({ abreMenu, abreNotificacoes }: { abreMenu: () => void, abreNotificacoes: () => void }) => {
  const location = useLocation();
  const { usuario } = useAuth();
  const [fotoPerfilSrc, setFotoPerfilSrc] = useState<string>(logoPerfil);

 useEffect(() => {
        if (usuario && usuario.fotoPerfil) {
            const urlCompleta = `${getMediaBaseUrl()}${usuario.fotoPerfil}`;
            setFotoPerfilSrc(urlCompleta);
        } else {
            setFotoPerfilSrc(logoPerfil);
        }
    }, [usuario]);


  const paginaSobre = location.pathname === '/Sobre';
  const linkSobreOuInicio = paginaSobre ? (
    <li><Link to="/">Início</Link></li>
  ) : (
    <li><Link to="/Sobre">Sobre</Link></li>
  );

  return (
    <header className='main-header'>
      <div className="container">
        <div className="containerEsquerda">
          <Link to='/' className="logo">
            <img src={logoYSV} alt="Logo YSV" className="logoYSV" />
          </Link>
          <nav className="Links">
            <ul>
              {linkSobreOuInicio}
              <li><Link to="/Agendamentos">Agendamentos</Link></li>
              <li><Link to="/Profissionais">Encontre um Profissional</Link></li>
              <li><Link to="/ParaProfissionais">Para Profissionais</Link></li>
            </ul>
          </nav>
        </div>
        <div className="containerDireita">
          <nav>
            <ul>
              <li><Link to="/Conversas"><img src={logoMess} alt="Ícone de Mensagens" className="logoMess" /></Link></li>
              <li onClick={(e) => { e.stopPropagation(); abreNotificacoes(); }}><img src={logoNotific} alt="Ícone de Notificações" className="LogoNot" /></li>
              <li onClick={abreMenu}>
                <img
                  className='fotoPerfilCabecalho'
                  src={fotoPerfilSrc}
                  alt="Foto de Perfil"
                  onError={(e) => {
                    e.currentTarget.src = logoPerfil;
                    console.error("Erro ao carregar foto de perfil. Usando fallback.");
                  }}
                />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Cabecalho;
