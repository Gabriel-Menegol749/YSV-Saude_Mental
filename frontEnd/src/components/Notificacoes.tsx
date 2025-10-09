import React, { forwardRef } from 'react';
import './notificacoes.css'
import botaoX from '../assets/x-pra sair.svg';

interface NotificacoesProps {
  onClose: () => void;
}

const Notificacoes = forwardRef<HTMLDivElement, NotificacoesProps>(({ onClose }, ref) => {
    return (
        <div className="NotificacoesContainer" ref={ref}>
            <div className="notificacoesCabecalho">
                <h3>Notificações:</h3>
                <button className="botaoFecharMenu" onClick={onClose}>
                    <img src={botaoX} alt="IconeX" className="IMGbotaoFecharMenu muda-cor-tema"/>
                </button>
            </div>
            <ul className="listaNotificacoes">
                <div className="notificacao">
                    <h3>Nome Notificação</h3>
                    <p>Conteúdo da Mensagem</p>
                </div>

                <div className="notificacao">
                    <h3>Nome Notificação</h3>
                    <p>Conteúdo da Mensagem</p>
                </div>

                <div className="notificacao">
                    <h3>Nome Notificação</h3>
                    <p>Conteúdo da Mensagem</p>
                </div>

                <div className="notificacao">
                    <h3>Nome Notificação</h3>
                    <p>Conteúdo da Mensagem</p>
                </div>
            </ul>
        </div>
    )
});

export default Notificacoes;