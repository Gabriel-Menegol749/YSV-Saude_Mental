import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Cabecalho.css';
import logoYSV from '../assets/logoNomYSV.png';
import logoNotific from '../assets/notificacao.png';
import logoPerfil from '../assets/profile-circle-svgrepo-com.svg';
import logoMess from '../assets/mensagensIcon.svg';

const Cabecalho = ({ abreMenu, abreNotificacoes }: { abreMenu: () => void, abreNotificacoes: () => void }) => {
  const API_BASE_URL = 'http://localhost:5000';
  const location = useLocation();

  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const usuarioLogado = localStorage.getItem('usuario');
    if (usuarioLogado) {
      setUsuario(JSON.parse(usuarioLogado));
    }
  }, []);

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
            <img src={logoYSV} alt="" className="logoYSV" />
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
              <li onClick={(e) => { e.stopPropagation(); abreMenu(); }}>
                <img className='fotoPerfilCabecalho'
                    src={ usuario?.fotoPerfil
                        ? (usuario.fotoPerfil.startsWith('http')
                            ? usuario.fotoPerfil
                            : `${API_BASE_URL}${usuario.fotoPerfil}`)
                            :logoPerfil
                    } alt="" />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Cabecalho;