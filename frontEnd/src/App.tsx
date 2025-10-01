import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
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
import AutenticacaoPage from './pages/AutenticacaoPage';
import PerfilPessoal from './pages/PerfilPessoal';
import Agendamentos from './pages/Agendamentos';
import Configuracoes from './pages/Configuracoes';
import Conversas from './pages/Conversas';
import Paraprofissionais from './pages/ParaProfissionais';
import Sobre from './pages/Sobre';

import Pagetest from './pages/PageTest';

function App() {
  const [menuAberto, setMenuAberto] = useState<'perfil' | 'notificacoes' | null>(null);
  const ignoreNextClickRef = useRef(false);

  const toggleMenu = (menu: 'perfil' | 'notificacoes') => {
    ignoreNextClickRef.current = true;
    setMenuAberto(prevMenu => (prevMenu === menu ? null : menu));
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      // Ignora o clique se ele foi disparado pela função de toggle
      if (ignoreNextClickRef.current) {
        ignoreNextClickRef.current = false;
        return;
      }

      // Se o menu de perfil ou o de notificações estiver aberto, checa se o clique foi fora deles
      if (menuAberto) {
        const menuElement = document.querySelector(menuAberto === 'perfil' ? '.menu' : '.notificacoes');
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setMenuAberto(null);
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuAberto]);

  return (
    <div className='App'>
      <ThemeProvider>
        <Cabecalho
          abreMenu={() => toggleMenu('perfil')}
          abreNotificacoes={() => toggleMenu('notificacoes')}
        />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/Profissionais" element={<ProfissionaisPage />} />
          <Route path="/AutenticacaoPage" element={<AutenticacaoPage />} />
          <Route path="/Configuracoes" element={<Configuracoes />} />
          <Route path="/Conversas" element={<Conversas />} />
          <Route path='/Agendamentos' element={<Agendamentos />} />
          <Route path="/PerfilPessoal" element={<PerfilPessoal />} />
          <Route path="/ParaProfissionais" element={<Paraprofissionais />} />
          <Route path="/Sobre" element={<Sobre />} />
          <Route path='/PageTeste' element={<Pagetest/>}></Route>
        </Routes>
        <Rodape />
        {menuAberto === 'perfil' && ReactDOM.createPortal(
          <MenuPerfil onClose={() => setMenuAberto(null)} />,
          document.body
        )}
        {menuAberto === 'notificacoes' && ReactDOM.createPortal(
          <Notificacoes onClose={() => setMenuAberto(null)} />,
          document.body
        )}
      </ThemeProvider>
    </div>
  );
};

export default App;