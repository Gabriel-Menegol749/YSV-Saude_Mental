import React, { useState, useEffect, type ChangeEvent } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import './InputPesquisa.css';
import lupaDPesquisa from '../assets/lupadPisquisaCinza.png';
import lupaSugestoes from '../assets/search.png';
import iconeHistorico from '../assets/history.png';
import iconedeletar from '../assets/icone-deleta.png';

// Opções iniciais da aba de sugestões
const sugestoesIniciais = [
  'Ansiedade e Estresse',
  'Depressão e Tristeza Profunda',
  'Saúde Mental no Trabalho e Burnout',
  'Saúde Sexual e Questões de Gênero/Sexualidade',
  'Manejo de Raiva e Impulsividade',
  'Transtornos do Neurodesenvolvimento',
  'Diagnóstico e Avaliação de Pacientes',
  'Orientação Profissional',
  'Dependência Química e Vícios',
  'Transtornos de Humor',
  'Desenvolvimento Pessoal e Autoconhecimento',
  'Transtornos Alimentares',
  'Questões de Relacionamento e Conflitos Familiares',
  'Luto e Perdas',
  'Transtornos do Sono',
];

interface InputPesquisaProps {
  onFiltrar?: (valor: string) => void;
}

const InputPesquisa: React.FC<InputPesquisaProps> = ({ onFiltrar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pgProfissionais = location.pathname.includes("/Profissionais");

  const [inputValue, setInputValue] = useState('');
  const [sugestoesPesquisa, setSugestoesPesquisa] = useState<string[]>([]);
  const [historicoPesquisa, setHistoricoPesquisa] = useState<string[]>([]);

  // Carrega histórico salvo
  useEffect(() => {
    const saveHistorico = localStorage.getItem('ysv_historicod_pesquisa');
    if (saveHistorico) setHistoricoPesquisa(JSON.parse(saveHistorico));
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const valor = event.target.value;
    setInputValue(valor);

    if (valor.length > 0) {
      const sugestoesFiltradas = sugestoesIniciais.filter(s =>
        s.toLowerCase().includes(valor.toLowerCase())
      );
      setSugestoesPesquisa(sugestoesFiltradas);
    } else {
      const sugestoesComHistorico = [
        ...historicoPesquisa,
        ...sugestoesIniciais.filter(s => !historicoPesquisa.includes(s)),
      ];
      setSugestoesPesquisa(sugestoesComHistorico);
    }
  };

  const handleInputFocus = () => {
    if (inputValue.length === 0) {
      const sugestoesComHistorico = [
        ...historicoPesquisa,
        ...sugestoesIniciais.filter(s => !historicoPesquisa.includes(s)),
      ];
      setSugestoesPesquisa(sugestoesComHistorico);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setSugestoesPesquisa([]);
    }, 150);
  };

  const handleSugestaoClick = (sugestao: string) => {
    setInputValue(sugestao);
    setSugestoesPesquisa([]);

    const novoHistorico = [sugestao, ...historicoPesquisa.filter(s => s !== sugestao)].slice(0, 5);
    setHistoricoPesquisa(novoHistorico);
    localStorage.setItem('ysv_historicod_pesquisa', JSON.stringify(novoHistorico));

    if (pgProfissionais) {
      onFiltrar?.(sugestao);
    } else {
      navigate(`/Profissionais?filtro=${encodeURIComponent(sugestao)}`);
    }
  };

  const handlePesquisanoEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue.trim().length > 0) {
      handleSugestaoClick(inputValue.trim());
    }
  };

  const removerSugestaoHistorico = (event: React.MouseEvent, sugestao: string) => {
    event.stopPropagation();
    const novoHistorico = historicoPesquisa.filter(item => item !== sugestao);
    setHistoricoPesquisa(novoHistorico);
    localStorage.setItem('ysv_historicod_pesquisa', JSON.stringify(novoHistorico));
    setSugestoesPesquisa(prev => prev.filter(item => item !== sugestao));
  };

  return (
        <div className="inputPesq">
          <label htmlFor="buscaCategoria">
            <img src={lupaDPesquisa} alt="Lupa" />
          </label>

          <input
            type="text"
            className="buscaCategoria"
            id="buscaCategoria"
            placeholder="Pesquise as especialidades que você precisa!"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handlePesquisanoEnter}
            autoComplete="off"
          />

          {sugestoesPesquisa.length > 0 && (
            <ul className="sugestoesMenu">
              {/* Histórico */}
              {historicoPesquisa
                .filter(s => s.toLowerCase().includes(inputValue.toLowerCase()))
                .map((s, i) => (
                  <li key={`hist-${i}`} className="itemHistorico"  onClick={() => handleSugestaoClick(s)}>
                        <div className="conteudoHistorico">
                            <img src={iconeHistorico} alt="Histórico" className="iconeSugestao" />
                            <span>{s}</span>
                        </div>
                        <button className='remover' onClick={(e: React.MouseEvent<HTMLButtonElement>) => removerSugestaoHistorico(e, s)}>
                            {<img src={iconedeletar} alt="" className='imgbuttondelete'/>}
                        </button>
                    </li>
                ))}

              {/* Sugestões padrões */}
              {sugestoesIniciais
                .filter(
                  s => s.toLowerCase().includes(inputValue.toLowerCase()) && !historicoPesquisa.includes(s)
                )
                .map((s, i) => (
                  <li key={`sug-${i}`} className="itemSugestao" onClick={() => handleSugestaoClick(s)}>
                    <img src={lupaSugestoes} alt="Sugestão" className="iconeSugestao" />
                    {s}
                  </li>
                ))}
            </ul>
          )}
            <button className='pesquisaInput'
                onClick={() => {
                    if (inputValue.trim().length > 0) {
                        handleSugestaoClick(inputValue.trim());
                    }
                }}
                    >
                    Pesquisar
            </button>
        </div>
  );
};

export default InputPesquisa;
