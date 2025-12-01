import { useState, useEffect } from "react";
import {  useSearchParams } from "react-router-dom";
import './AutenticacaoPg.css';
import logoysv from '../assets/logoYSV.png';
import { useAuth } from "../contextos/ContextoAutenticacao";
import { useNavigate } from 'react-router-dom';

type UsuarioTipo = 'Cliente' | 'Profissional';
type Modo = 'login' | 'cadastroCliente' | 'cadastroProfissional';


export default function AutenticacaoPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const modoQuery = searchParams.get("modo") as Modo || null; 

    const [modo, setModo] = useState<Modo>(modoQuery || 'login');
    const [nome, setNome] = useState('');
    const [CRP, setCRP] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [tipoUsuario, setTipoUsuario] = useState<UsuarioTipo>(modo === 'cadastroProfissional' ? 'Profissional' : 'Cliente');
    const [profissao, setProfissao] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [carregando, setCarregando] = useState(false);

    const { login: loginContexto } = useAuth();

    useEffect(() => {
        if(modoQuery){
            setModo(modoQuery);
            setTipoUsuario(modoQuery === 'cadastroProfissional' ? 'Profissional' : 'Cliente');
        }
    }, [modoQuery])

    const alternarModo = (novoModo: Modo) => {
        setModo(novoModo);
        setNome('');
        setCRP('');
        setEmail('');
        setSenha('');
        setTipoUsuario(novoModo === 'cadastroProfissional' ? 'Profissional' : 'Cliente');
        setMensagem('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCarregando(true);
        setMensagem('');

        const urlBase = 'http://localhost:5000/api/auth';
        const headers = { 'Content-Type': 'application/json' };

        try {
            if (modo === 'login') {
                {/*LOGIN */}
                const res = await fetch(`${urlBase}/login`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ email, senha }),
                });

                const data = await res.json();
                            console.log("DEBUG - Dados do backend após login:", data);

                if (!res.ok) throw new Error(data.msg || 'Erro no login!');

                const usuarioParaContexto = {
                    ...data.usuario,
                    _id: data.usuario._id || data.usuario.id, // Prioriza _id, senão usa id
                    id: undefined // Remove o campo 'id' se ele existe e não é o padrão
                };

                loginContexto({ usuario: usuarioParaContexto, token: data.token });

                setMensagem(`Login realizado! Seja bem-vindo(a), ${data.usuario.nome}`);
                navigate('/')

            } else {
                {/*CADASTRO */}
                const body: any = { nome, email, senha, tipoUsuario };
                if (modo === 'cadastroProfissional'){
                    body.CRP = CRP;
                    body.profissao = profissao;
                }

                const res = await fetch(`${urlBase}/registro`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                });

                const data = await res.json();
                            console.log("DEBUG - Dados do backend após registro:", data);

                if (!res.ok) throw new Error(data.msg || 'Erro no registro!');

                const usuarioParaContexto = {
                    ...data.usuario,
                    _id: data.usuario._id || data.usuario.id, // Prioriza _id, senão usa id
                    id: undefined // Remove o campo 'id' se ele existe e não é o padrão
                };

                loginContexto({ usuario: usuarioParaContexto, token: data.token });

                setMensagem('Usuário registrado com sucesso! Faça login.');
                navigate("/?novoCadastro=true");
            }
        } catch (err: any) {
            setMensagem(err.message);
        } finally {
            setCarregando(false);
        }
    };

    const titulo =
        modo === 'login'
            ? 'Login'
            : modo === 'cadastroCliente'
            ? 'Comece seu Tratamento com a YSV!'
            : 'Trabalhe Conosco na YSV!';

    return (
        <div className="TelaAutenticacao">
                <div>
                    <img 
                src={logoysv}
                alt="Logo YSV"
                className="logoYSV"
                onClick={() => navigate('/')}
                style={{ cursor: 'pointer' }}
            />
                </div>
            <form onSubmit={handleSubmit} className="telaCadastroLogin">
                <p>Seja Bem-Vindo(a)!</p>
                <h2>{titulo}</h2>

                {modo !== 'login' && (
                    <input
                        type="text"
                        placeholder="Nome Completo"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                    />
                )}

                <input
                    type="text"
                    placeholder="E-Mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                />

                {modo === 'cadastroProfissional' && (
                    <>
                        <select value={profissao} className="inputProfissao"
                            onChange={(e) => setProfissao(e.target.value)}
                            required
                        >
                            <option value="">Selecione sua profissão</option>
                            <option value="Psicologo">Psicólogo(a)</option>
                            <option value="Psiquiatra">Psiquiatra</option>
                        </select>
                        <input
                            type="text"
                            placeholder="CRP"
                            value={CRP}
                            onChange={(e) => setCRP(e.target.value)}
                            required
                        />
                    </>
                )}

                <button type="submit" disabled={carregando}> {/* AQUI: Usando 'carregando' para desabilitar o botão */}
                    {carregando ? 'Carregando...' : (modo === 'login' ? 'Entrar' : 'Registrar')}
                </button>

                {modo !== 'login' && (
                    <button
                        type="button"
                        onClick={() =>
                            alternarModo(
                                modo === 'cadastroCliente'
                                    ? 'cadastroProfissional'
                                    : 'cadastroCliente'
                            )
                        }
                    >
                        {modo === 'cadastroCliente'
                            ? 'Cadastrar como Profissional'
                            : 'Cadastrar como Cliente'}
                    </button>
                )}
            </form>

            <p className="texto">
                {modo === 'login' ? (
                    <>
                        Não possui uma conta ainda?{' '}
                        <span onClick={() => alternarModo('cadastroCliente')}>
                            Cadastre-se Aqui!
                        </span>
                    </>
                ) : (
                    <>
                        Já tem conta?{' '}
                        <span onClick={() => alternarModo('login')}>
                            Faça Login aqui!
                        </span>
                    </>
                )}
            </p>

            {mensagem && <p className="mensagem">{mensagem}</p>}
        </div>
    );
}
