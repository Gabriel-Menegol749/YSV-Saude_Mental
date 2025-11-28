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
  const [fotoPerfilSrc, setFotoPerfilSrc] = useState<string>(logoPerfil);

  useEffect(() => {
    const usuarioLogado = localStorage.getItem('usuario');
    if (usuarioLogado) {
      try {
        const parsedUsuario = JSON.parse(usuarioLogado);
        setUsuario(parsedUsuario);

        if (parsedUsuario.fotoPerfil) {
          const fotoUrl = parsedUsuario.fotoPerfil.startsWith('http')
            ? parsedUsuario.fotoPerfil
            : `${API_BASE_URL}${parsedUsuario.fotoPerfil}`;
          setFotoPerfilSrc(fotoUrl);
        } else {
          setFotoPerfilSrc(logoPerfil);
          console.log("Usuário logado, mas sem fotoPerfil. Usando logoPerfil padrão.");
        }
      } catch (error) {
        console.error("Erro ao parsear usuário do localStorage:", error);
        setUsuario(null);
        setFotoPerfilSrc(logoPerfil);
      }
    } else {
      setUsuario(null);
      setFotoPerfilSrc(logoPerfil);
      console.log("Nenhum usuário logado. Usando logoPerfil padrão.");
    }
  }, [API_BASE_URL]);

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
              <li onClick={(e) => { e.stopPropagation(); abreMenu(); }}>
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
