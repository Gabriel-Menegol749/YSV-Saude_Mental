import React, { useState } from 'react';
import { Routes, Route} from 'react-router-dom';
import ReactDOM from 'react-dom';
import './App.css';

//componentes do sistema
import Cabecalho from './components/Cabecalho';
import Rodape from './components/Rodape';
import Notificacoes from './components/Notificacoes';
import MenuPerfil from './components/MenuPerfil';

//Importação de provedor de temas pro sistema
import { ThemeProvider } from './hooks/usaTema';

//Páginas do meu sistema
import HomePage from './pages/HomePage';
import ProfissionaisPage from './pages/Profissionais';
import AutenticacaoPage from './pages/AutenticacaoPage';
import SobrePage from './pages/SobrePage';
import PerfilPessoal from './pages/PerfilPessoal';
import Agendamentos from './pages/Agendamentos';
import Configuracoes from './pages/Configuracoes';
import Conversas from './pages/Conversas';
import Paraprofissionais from './pages/ParaProfissionais';

function App(){
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  return(
    <div className='App'>
      <ThemeProvider>
          <Cabecalho
            abreMenu={() => setMenuPerfilAberto(estadoAnterior => !estadoAnterior)}
            abreNotificacoes={() => setNotificacoesAbertas(estadoAnterior => !estadoAnterior)}
          />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/Profissionais" element={<ProfissionaisPage />} />
            <Route path="/Autenticação" element={<AutenticacaoPage />} />
            <Route path="/Sobre" element={<SobrePage />} />
            <Route path="/Configuracoes" element={<Configuracoes/>}/>
            <Route path="/Conversas" element={<Conversas/>}/>
            <Route path='/Agendamentos' element={<Agendamentos/>}/>
            <Route path="/PerfilPessoal" element={<PerfilPessoal/>}/>
            <Route path="/ParaProfissionais" element={<Paraprofissionais/>}/>
          </Routes>
          <Rodape/>
          {/*Renderização do Menu Perfil como um portal*/}
          {menuPerfilAberto && ReactDOM.createPortal(
            <MenuPerfil onClose={() => setMenuPerfilAberto(false)}/>,
            document.body
          )}
          {/*Renderização da Aba de Notificações como um portal*/}
          {notificacoesAbertas && ReactDOM.createPortal(
            <Notificacoes onClose={() => setNotificacoesAbertas(false)}/>,
            document.body
          )}
      </ThemeProvider>
    </div>
  );
};

export default App;