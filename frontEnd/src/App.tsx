import React from 'react'
import { Routes, Route} from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProfissionaisPage from './pages/ProfissionaisPage';
import AutenticacaoPage from './pages/AutenticacaoPage';
import SobrePage from './pages/SobrePage';
import Cabecalho from './components/Cabecalho';

import './App.css';

function App(){
  return(
    <div className='App'>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profissionais" element={<ProfissionaisPage />} />
        <Route path="/Autenticação" element={<AutenticacaoPage />} />
        <Route path="/sobre" element={<SobrePage />} />
      </Routes>
    </div>

  );
};

export default App;