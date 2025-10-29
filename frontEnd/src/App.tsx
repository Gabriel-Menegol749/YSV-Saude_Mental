import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ReactDOM from 'react-dom';
import './App.css';

// componentes do sistema
import Cabecalho from './components/Cabecalho';
import Rodape from './components/Rodape';
import Notificacoes from './components/Notificacoes';
import MenuPerfil from './components/MenuPerfil';

// Importação de provedor de temas pro sistema
import { ThemeProvider } from './hooks/usaTema';

// Páginas do meu sistema
import HomePage from './pages/HomePage';
import ProfissionaisPage from './pages/Profissionais';
import PerfilPessoal from './pages/PerfilPessoal';
import Agendamentos from './pages/Agendamentos';
import Configuracoes from './pages/Configuracoes';
import Conversas from './pages/Conversas';
import Paraprofissionais from './pages/ParaProfissionais';
import Sobre from './pages/Sobre';
import AutenticacaoPage from './pages/AutenticacaoPg';

function App() {
const [menuAberto, setMenuAberto] = useState<'perfil' | 'notificacoes' | null>(null);
const location = useLocation();

const menuPerfilRef = useRef<HTMLDivElement>(null);
const notificacoesRef = useRef<HTMLDivElement>(null);

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

    if (cabecalhoIcons && cabecalhoIcons.contains(target)) {
      return;
    }

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

//
const telaSemCabecalho = ['/Autenticacao', '/Conversas'];
const mostrarLayoutNormal =!telaSemCabecalho.includes(location.pathname);

return (
  <div className='App'>
    <ThemeProvider>
      {mostrarLayoutNormal && (
      <Cabecalho
        abreMenu={() => toggleMenu('perfil')}
        abreNotificacoes={() => toggleMenu('notificacoes')}
      />
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/Autenticacao" element={<AutenticacaoPage />} />
        <Route path="/Profissionais" element={<ProfissionaisPage />} />
        <Route path="/Configuracoes" element={<Configuracoes />} />
        <Route path="/Conversas" element={<Conversas />} />
        <Route path='/Agendamentos' element={<Agendamentos />} />
        <Route path="/PerfilPessoal" element={<PerfilPessoal />} />
        <Route path="/ParaProfissionais" element={<Paraprofissionais />} />
        <Route path="/Sobre" element={<Sobre />} />
      </Routes>

      {mostrarLayoutNormal && <Rodape />}

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
};

export default App;