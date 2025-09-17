import React, { useEffect, useRef } from "react";
import './notificacoes.css'
import botaoX from '../assets/x-pra sair.svg';

const Notificacoes = ({ onClose } : { onClose : () => void }) => {
    const refNotificacoes = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleAoClicarFora = (event: MouseEvent) => {
            if(refNotificacoes.current && !refNotificacoes.current.contains(event.target as Node)){
                onClose();
            }
        };
        document.addEventListener('mousedown', handleAoClicarFora);
        return () => {
            document.removeEventListener('mousedown', handleAoClicarFora);
        };
    }, [onClose]);

    return (
        <div className="NotificacoesContainer" ref={refNotificacoes}>
            <div className="notificacoesCabecalho">
                <h3>Notificações:</h3>
                <button className="botaoFecharMenu" onClick={onClose}><img src={botaoX} alt="IconeX" className="IMGbotaoFecharMenu muda-cor-tema"/></button>
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
            </ul>
        </div>
    )
}

export default Notificacoes;