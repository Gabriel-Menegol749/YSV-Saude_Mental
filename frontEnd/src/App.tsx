import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ReactDOM from 'react-dom';
import './App.css';
import botaoXsair from './assets/x-pra sair.svg'

// componentes do sistema
import Cabecalho from './components/Cabecalho';
import Rodape from './components/Rodape';
import Notificacoes from './components/Notificacoes';
import MenuPerfil from './components/MenuPerfil';

// Importação de provedor de temas pro sistema
import { ThemeProvider } from './hooks/usaTema';

// Importação da autenticação para ver se o usuário ta logado ou nem
import { useAuth } from './contextos/ContextoAutenticacao';

// Componente que faz com que algumas rotas só possam ser acessadas, caso o usuário estiver logado
import { RotasPrivadas } from './components/RotasPrivadas';

// Páginas do meu sistema
import HomePage from './pages/HomePage';
import ProfissionaisPage from './pages/Profissionais';
import PerfilPessoal from './pages/PerfilPessoal';
import Agendamentos from './pages/Agendamentos';
import Conversas from './pages/Conversas';
import Paraprofissionais from './pages/ParaProfissionais';
import Sobre from './pages/Sobre';
import AutenticacaoPage from './pages/AutenticacaoPg';
import PerfisSalvos from './pages/PerfisSalvos'
import AgendaEdicao from './components/AgendaEdicao';
import VideoChamadaPage from './pages/VideoChamadaPage';

// ScrollToTop direto no App
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Constante para gerar um pop-up que sugere o profissional da saúde complementar seu perfil
const ModalPerfil = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const irParaPefil = () => {
    onClose();
    if (usuario?._id) {
      navigate(`/perfil/${usuario._id}/editar`);
    } else {
      navigate('/Configuracoes');
    }
  };

  return ReactDOM.createPortal(
    <div className="popup">
      <div className="popupConteudo">
        Seja Bem-Vindo(a) YSV!
        <p>Seu cadastro foi realizado com sucesso! Complemente seu perfil para atrair mais clientes e conseguir novos agendamentos!</p>
        <button onClick={irParaPefil}>Visitar Perfil</button>
        <button onClick={onClose}> <img src={botaoXsair} alt="" /></button>
      </div>
    </div>,
    document.body
  );
};

function App() {
  const [menuAberto, setMenuAberto] = useState<'perfil' | 'notificacoes' | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mostrarModalPerfil, setMostrarModalPerfil] = useState(false);

  const { usuario, carregando } = useAuth();

  const menuPerfilRef = useRef<HTMLDivElement>(null);
  const notificacoesRef = useRef<HTMLDivElement>(null);

  // UseEffect para checar cadastros novos para função de pop-up
  useEffect(() => {
    const novoCadastro = searchParams.get('novoCadastro');
    if (novoCadastro === 'true' && usuario) {
      setMostrarModalPerfil(true);
      const novoSearchParams = new URLSearchParams(searchParams.toString());
      novoSearchParams.delete('novoCadastro');
      navigate(`?${novoSearchParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate, usuario]);

  const toggleMenu = (menu: 'perfil' | 'notificacoes') => {
    setMenuAberto(prevMenu => (prevMenu === menu ? null : menu));
  };

  useEffect(() => {
    if (menuAberto) {
      setMenuAberto(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const cabecalhoIcons = document.querySelector('.containerDireita');

      if (cabecalhoIcons && cabecalhoIcons.contains(target)) return;

      if (menuAberto === 'perfil' && menuPerfilRef.current && !menuPerfilRef.current.contains(target)) {
        setMenuAberto(null);
      }

      if (menuAberto === 'notificacoes' && notificacoesRef.current && !notificacoesRef.current.contains(target)) {
        setMenuAberto(null);
      }
    };

    if (menuAberto) {
      document.addEventListener('mousedown', handleOutsideClick as EventListener);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick as EventListener);
    };
  }, [menuAberto]);

  // Retira o cabeçalho e o rodapé das telas de login/cadastro e de chats
  const telaSemCabecalho = ['/Autenticacao', '/conversas', '/VideoChamadaPage'];
  const mostrarLayoutNormal = !telaSemCabecalho.includes(location.pathname);

  if (carregando) {
    return (
      <div className='App-loading-tela-cheia' style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Carregando YSV...</h2>
      </div>
    );
  }

  return (
    <div className='App'>
      <ThemeProvider>
        <ScrollToTop />
        {mostrarLayoutNormal && (
          <Cabecalho
            abreMenu={() => toggleMenu('perfil')}
            abreNotificacoes={() => toggleMenu('notificacoes')}
          />
        )}

        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/Autenticacao" element={<AutenticacaoPage />} />
          <Route path="/Profissionais" element={<ProfissionaisPage />} />
          <Route path="/perfil/:id" element={<PerfilPessoal />} />
          <Route path="/ParaProfissionais" element={<Paraprofissionais />} />
          <Route path="/Sobre" element={<Sobre />} />

          {/* Rotas privadas -- Necessitam de Login */}
          <Route path="/conversas" element={<RotasPrivadas><Conversas /></RotasPrivadas>} />
          <Route path="/conversas/:destinatarioId" element={<RotasPrivadas><Conversas /></RotasPrivadas>} />
          <Route path='/Agendamentos' element={<RotasPrivadas><Agendamentos /></RotasPrivadas>} />
          <Route path="/perfil/:id/editar" element={<RotasPrivadas><PerfilPessoal/></RotasPrivadas>} />
          <Route path='/PerfisSalvos' element={<RotasPrivadas><PerfisSalvos/></RotasPrivadas>}/>
          <Route path="/perfil/:id/editar/agenda" element={<RotasPrivadas><AgendaEdicao /></RotasPrivadas>} />
          <Route path='/videoChamada/:roomId' element={<RotasPrivadas><VideoChamadaPage/></RotasPrivadas>}/>
        </Routes>

        {mostrarLayoutNormal && <Rodape />}

        {/* Renderizar o modal do pop-up se o cadastro novo for feito */}
        {mostrarModalPerfil && (
          <ModalPerfil onClose={() => setMostrarModalPerfil(false)} />
        )}

        {menuAberto === 'perfil' && ReactDOM.createPortal(
          <MenuPerfil ref={menuPerfilRef} onClose={() => setMenuAberto(null)} />,
          document.body
        )}

        {menuAberto === 'notificacoes' && ReactDOM.createPortal(
          <Notificacoes ref={notificacoesRef} onClose={() => setMenuAberto(null)} />,
          document.body
        )}
      </ThemeProvider>
    </div>
  );
}

export default App;
