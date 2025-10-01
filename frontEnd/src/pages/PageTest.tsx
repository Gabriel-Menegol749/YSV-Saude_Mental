// Carrossel.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PageTest.css'
import fotoLuto from '../assets/fotosCardsHomepage/Luto_card.jpg'

const banners = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  title: `Banner ${i + 1}`,
  imageUrl: fotoLuto,
  linkTo: `/pagina/${i + 1}`
}));

const BANNERS_POR_PAGINA = 5;

export default function Carrossel() {
  const [paginaAtual, setPaginaAtual] = useState(0);
  const navigate = useNavigate();

  const totalPaginas = Math.ceil(banners.length / BANNERS_POR_PAGINA);

  const handleClickDireita = () => {
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas - 1));
  };

  const handleClickEsquerda = () => {
    setPaginaAtual((prev) => Math.max(prev - 1, 0));
  };

  const bannersVisiveis = banners.slice(
    paginaAtual * BANNERS_POR_PAGINA,
    paginaAtual * BANNERS_POR_PAGINA + BANNERS_POR_PAGINA
  );

  return (
    <div className="carrossel-container">
      {paginaAtual > 0 && (
        <button className="botao botao-esquerda" onClick={handleClickEsquerda}>
          ◀
        </button>
      )}

      <div className="carrossel">
        {bannersVisiveis.map((banner) => (
          <div
            key={banner.id}
            className="banner"
            style={{ backgroundImage: `url(${banner.imageUrl})` }}
            onClick={() => navigate(banner.linkTo)}
          >
            <div className="titulo">{banner.title}</div>
          </div>
        ))}
      </div>

      {paginaAtual < totalPaginas - 1 && (
        <button className="botao botao-direita" onClick={handleClickDireita}>
          ▶
        </button>
      )}

    </div>
  );
}
