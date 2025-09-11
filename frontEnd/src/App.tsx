import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import ReactDOM from 'react-dom';
import Cabecalho from './components/Cabecalho';
import Rodape from './components/Rodape';

//Importação de provedor de temas pro sistema
import { ThemeProvider } from './hooks/usaTema';

//Páginas do meu sistema
import HomePage from './pages/HomePage';
import ProfissionaisPage from './pages/ProfissionaisPage';
import AutenticacaoPage from './pages/AutenticacaoPage';
import SobrePage from './pages/SobrePage';

import PerfilPessoal from './pages/PerfilPessoal';
import Configuracoes from './pages/Configuracoes';
import Conversas from './pages/Conversas';

import './App.css';

function App(){
    const [menuAberto, setMenuAberto] = useState(false);
  return(
    <div className='App'>
      <ThemeProvider>
        <Cabecalho/>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/Profissionais" element={<ProfissionaisPage />} />
          <Route path="/Autenticação" element={<AutenticacaoPage />} />
          <Route path="/Sobre" element={<SobrePage />} />
          <Route path="/Configuracoes" element={<Configuracoes/>}/>
          <Route path="/Conversas" element={<Conversas/>}/>
          <Route path="/PerfilPessoal" element={<PerfilPessoal/>}/>
        </Routes>
        <Rodape/>
      </ThemeProvider>
    </div>

  );
};

export default App;