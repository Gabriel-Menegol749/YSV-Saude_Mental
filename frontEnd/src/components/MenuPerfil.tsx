import { useState, forwardRef } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { usaTema } from "../hooks/usaTema";
import { useAuth } from "../contextos/ContextoAutenticacao";

import './MenuPerfil.css';
import logoPerfil from '../assets/profile-circle-svgrepo-com.svg';
import botaoX from '../assets/x-pra sair.svg';
import ajuda from '../assets/questionMark.svg';
import acessibilidade from '../assets/lua.svg';
import editarPerfil from '../assets/lapis.svg';
import perfisSalvos from '../assets/salve.png'
import config from '../assets/configIcon.svg';
import sair from '../assets/sair.svg';

interface MenuPerfilProps {
    onClose: () => void;
}

const MenuPerfil = forwardRef<HTMLDivElement, MenuPerfilProps>(({ onClose }, ref) => {
    const [menuAtivo, setMenuAtivo] = useState<'principal' | 'acessibilidade' | 'ajuda' | null>('principal');
    const { tema, toggleTema, tamanhoFonte, handleTamanhoFonte } = usaTema();
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();
    const API_BASE_URL = 'http://localhost:5000';
    console.log('DEBUG MenuPerfil - usuario:', usuario);


    const handleLogout = () => {
        logout();
        onClose();
        navigate('/');
    }

    const handleLoginClick = () => {
        onClose();
        navigate('/Autenticacao?modo=login')
    }


    const renderizarMenu = () => {
        switch (menuAtivo) {
            case 'principal':
                return (
                    <>
                        <div className="telaAcima">
                            <div className="perfil">
                                <div className="perfDiv">
                                    <img
                                        src={ usuario?.fotoPerfil
                                            ? (usuario.fotoPerfil.startsWith('http')
                                                ? usuario.fotoPerfil
                                                : `${API_BASE_URL}${usuario.fotoPerfil}`)
                                                :logoPerfil
                                        } alt="" />
                                    <p className="nomeUser">{usuario ? usuario.nome : <span onClick={handleLoginClick} style={{cursor : 'pointer'}}>Faça Login!</span>}</p>
                                </div>
                                <button className="botaoFecharMenu" onClick={onClose}><img src={botaoX} alt="IconeX" className="IMGbotaoFecharMenu muda-cor-tema" /></button>
                            </div>
                            <Link to='/GerenciamentoDContas' onClick={onClose}><button className="TrocarConta">Gerenciar Contas</button></Link>
                        </div>
                        <ul>
                            <li className="divisor"></li>

                            {usuario && usuario._id ? (
                                <Link to={`/perfil/${usuario._id}`} className="linkToULLI" onClick={onClose}>
                                    <li><img src={editarPerfil} alt="" className="muda-cor-tema" />Meu perfil</li>
                                </Link>
                            ) : (
                                <Link to="/Autenticacao" className="linkToULLI" onClick={onClose}>
                                    <li><img src={editarPerfil} alt="" className="muda-cor-tema" />Meu perfil</li>
                                </Link>
                            )}

                            <li onClick={() => setMenuAtivo('acessibilidade') }>
                                <img src={acessibilidade} alt="" className="muda-cor-tema" />Tela e Acessibilidade</li>
                            <Link to="/PerfisSalvos" className="linkToULLI" onClick={onClose}>
                                <li><img src={perfisSalvos} alt="muda-cor-tema" />Perfis Salvos</li>
                            </Link>
                            <li onClick={() => setMenuAtivo('ajuda')}>
                                <img src={ajuda} alt="" className="muda-cor-tema" />Ajuda e Suporte</li>
                            <Link to="/Configuracoes" className="linkToULLI" onClick={onClose}>
                                <li><img src={config} alt="" className="muda-cor-tema" />Configurações</li>
                            </Link>
                            <li onClick={handleLogout} className="linkToULLI">
                                <img src={sair} alt="" className="muda-cor-tema" />
                                <button className="sairConta">Sair</button>
                            </li>

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
                            <p>Ajudste o tamanho da fonte para facilitar a legibilidade do sistema!</p>
                            <div className="opcoes-fonte">
                                <label><input type="radio" name="tamanho-Font" value="reduzido" checked={tamanhoFonte === 'reduzido'} onChange={handleTamanhoFonte}/>Reduzido</label>
                                <label><input type="radio" name="tamanho-Font" value="normal" checked={tamanhoFonte === 'normal'} onChange={handleTamanhoFonte}/>Normal</label>
                                <label><input type="radio" name="tamanho-Font" value="grande" checked={tamanhoFonte === 'grande'} onChange={handleTamanhoFonte}/>Grande</label>
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
        <div className="menu" ref={ref}>
            {renderizarMenu()}
        </div>
    );
});
export default MenuPerfil;