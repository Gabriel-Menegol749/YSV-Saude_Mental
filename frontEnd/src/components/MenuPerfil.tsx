import React, { useEffect, useRef, useState } from "react";
import { Link} from 'react-router-dom';
import { usaTema } from "../hooks/usaTema";
import './MenuPerfil.css';
import logoPerfil from '../assets/profile-circle-svgrepo-com.svg';
import botaoX from '../assets/x-pra sair.svg';
import  ajuda from '../assets/questionMark.svg';
import acessibilidade from '../assets/lua.svg';
import editarPerfil from '../assets/lapis.svg';
import config from '../assets/configIcon.svg';
import sair from '../assets/sair.svg';



const MenuPerfil = ({ onClose }: { onClose: () => void}) => {
    const refMenu = useRef<HTMLDivElement>(null);
    const [menuAtivo, setMenuAtivo] = useState<'principal' | 'acessibilidade' | 'ajuda' | null>('principal');
    const{ tema, toggleTema, tamanhoFonte, handleTamanhoFonte } = usaTema();

    useEffect(() => {
        const aoClicarFora = (event: MouseEvent) => {
            if(refMenu.current && !refMenu.current.contains(event.target as Node)){
                onClose();
            }
            }
        document.addEventListener("mousedown", aoClicarFora as any);
        return () => {
            document.removeEventListener("mousedown", aoClicarFora as any);
        };
    }, [onClose]);

    const renderizarMenu = () => {
        switch (menuAtivo) {
            case 'principal':
                return (
                    <>
                        <div className="telaAcima">
                            <div className="perfil">
                                <div className="perfDiv">
                                    <img src={logoPerfil} alt="Ícone de Perfil" className="LogoPerf"/>
                                    <p className="nomeUser">Faça Login!</p>
                                </div>
                                <button className="botaoFecharMenu" onClick={onClose}><img src={botaoX} alt="IconeX" className="IMGbotaoFecharMenu muda-cor-tema"/></button>
                            </div>
                            <Link to='/GerenciamentoDContas'><button className="TrocarConta">Gerenciar Contas</button></Link>
                        </div>
                        <ul>
                            <li className="divisor"></li>
                            <Link to="/PerfilPessoal" className="linkToULLI">
                                <li><img src={editarPerfil} alt="" className="muda-cor-tema" />Meu perfil</li>
                            </Link>
                            <li onClick={() => setMenuAtivo('acessibilidade')}>
                                <img src={acessibilidade} alt="" className="muda-cor-tema" />Tela e Acessibilidade</li>
                            <li onClick={() => setMenuAtivo('ajuda')}>
                                <img src={ajuda} alt="" className="muda-cor-tema" />Ajuda e Suporte</li>
                            <Link to="/Configuracoes" className="linkToULLI">
                                <li><img src={config} alt="" className="muda-cor-tema" />Configurações</li>
                            </Link>
                            <Link to="/" className="linkToULLI">
                                <li><img src={sair} alt="" className="muda-cor-tema" /><button className="sairConta">Sair</button></li>
                            </Link>
                        </ul>
                    </>
                );
            case 'acessibilidade':
                return (
                    <div className="sub-menu">
                        <div className="sub-menu-cabecalho">
                            <button className="voltarMenuPrincipal" onClick={() => setMenuAtivo('principal')}>Voltar</button>
                        </div>
                        <div className="Tela_Acessibilidade">
                            <h3>Modo Escuro</h3>
                            <p>Ajuste a aparência do YSV para reduzir o brilho e dar um descanso para os olhos!</p>
                            <div className="opcoes-checkbox">
                                <label><input type="radio" name="tema" checked={tema === 'Escuro'} onChange={toggleTema} />Ativado</label>
                                <label><input type="radio" name="tema" checked={tema === 'Claro'} onChange={toggleTema} />Desativado</label>
                            </div>
                            <h3>Tamanho da Fonte:</h3>
                            <div className="opcoes-fonte">
                                <input
                                    type="range"
                                    min="15"
                                    max="25"
                                    value={tamanhoFonte}
                                    onChange={handleTamanhoFonte}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'ajuda':
                return (
                    <div className="sub-menu">
                        <div className="sub-menu-cabecalho">
                            <button className="voltarMenuPrincipal" onClick={() => setMenuAtivo('principal')}>Voltar</button>
                        </div>
                        <ul>
                            <li>FAQ</li>
                            <li>Central de Ajuda</li>
                            <li>Entre em contato</li>
                        </ul>
                    </div>
                );
            default:
                return null;
        }
    };
    return (
        <div className="menu" ref={refMenu}>
            {renderizarMenu()}
        </div>
    );
};
export default MenuPerfil;