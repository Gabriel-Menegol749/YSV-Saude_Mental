import { useState } from "react";
import './AutenticacaoPg.css';
import logoysv from '../assets/logoYSV.png';

type UsuarioTipo = 'Cliente' | 'Profissional';
type Modo = 'login' | 'cadastroCliente' | 'cadastroProfissional';

export default function AutenticacaoPage() {
    const [modo, setModo] = useState<Modo>('login');
    const [nome, setNome] = useState('');
    const [CRP, setCRP] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [tipoUsuario, setTipoUsuario] = useState<UsuarioTipo>('Cliente');
    const [mensagem, setMensagem] = useState('');
    const [carregando, setCarregando] = useState(false);

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
                if (!res.ok) throw new Error(data.msg || 'Erro no login!');

                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));

                setMensagem(`Login realizado! Seja bem-vindo(a), ${data.usuario.nome}`);
                window.location.href = "/";

            } else {
                {/*CADASTRO */}
                const body: any = { nome, email, senha, tipoUsuario };
                if (modo === 'cadastroProfissional') body.CRP = CRP;

                const res = await fetch(`${urlBase}/registro`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.msg || 'Erro no registro!');

                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));

                setMensagem('Usuário registrado com sucesso! Faça login.');
                alternarModo('login');
                window.location.href = "/";

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
                    <img src={logoysv} alt="Logo YSV" className="logoYSV" />
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
                    <input
                        type="text"
                        placeholder="CRP"
                        value={CRP}
                        onChange={(e) => setCRP(e.target.value)}
                        required
                    />
                )}

                <button type="submit">
                    {modo === 'login' ? 'Entrar' : 'Registrar'}
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
