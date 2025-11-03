import { useState, useEffect } from "react";
import { useAuth } from "../contextos/ContextoAutenticacao";
import { useNavigate } from "react-router-dom";
import './PerfilPessoal.css'

//Imports de imagens
import fotoUserDefault from '../assets/fotoProfissional2.png';
import salvar from '../assets/salve.png';
import editar from '../assets/lapis.svg';
import excluir from '../assets/lixo-delete.png';

//Tags de especialidades pré-definidas
const especialidades_disponiveis = [
        'Ansiedade e Estresse',
        'Depressão e Tristeza Profunda',
        'Saúde Mental no Trabalho e Burnout',
        'Saúde Sexual e Questões de Gênero/Sexualidade',
        'Manejo de Raiva e Impulsividade',
        'Transtornos do Neuro desenvolvimento',
        'Diagnóstico e Avaliação de Pacientes',
        'Orientação Profissional',
        'Dependência Química e Vícios',
        'Transtornos de Humor',
        'Desenvolvimento Pessoal e Autoconhecimento',
        'Transtornos Alimentares',
        'Questões de Relacionamento e Conflitos Familiares',
        'Luto e Perdas',
        'Transtornos do Sono'
]

//Avisa erro no servidor
interface BackendError {
    msg?: string,
}

//Interface que espelha o modelo completo dos usuarios do backend
interface PerfilUsuario {
    _id: string,
    nome: string,
    email: string,
    tipoUsuario: 'Cliente' | 'Profissional';
    telefoneContato?: string,
    genero?: string,
    fotoPerfil?: string,

    //Dados que somente profissionais precisam
    infoProfissional?: {
        crp?: string;
        especialidades?: string[];
        valorConsulta?: Number;
        enderecoConsultorio?: string;
    }
    //todos os usuarios podem ser clientes, então aqui, será carregado todos os usuarios
    infoCliente?: {
        enderecoUsuario?: string,
    }

}
export default function PerfilPessoal() {


    return (
            <div className="PerfilPessoal">
                {/*há de ser implementada funções de perfil de clientes comuns, sem ser profissionais e edição de perfil, como buttons, icones
                    entre outros */}

                <div className="card">
                    <div className="fotoPerfil">
                        {/*foto user default é uma daquelas foto normal que só tem um bonequinho, mas muda quando é colocado uma foto perfil no registro do banco */}
                        <img src={fotoUserDefault} alt="" className="foto"/>
                    </div>
                    {/*aqui mostra se ele é psicologo ou psiquiatra*/}
                    <p>tituloProfissao</p>
                    <h1>nomeUsuario</h1>
                        <div className="infoperfil">
                            <p>CRP 06/58974</p>
                            <div className="estrelinhas"></div>
                        </div>
                    {/*Funcionalidade de salvamento de perfis, ainda nem sei como implementar, mas queria uma seção, onde pudessemos salvar os perfis e mostrar eles, 
                    possivelmente adicionar um botão no menu do cabecalho que mostra uma pg onde mostra todos os perfis de profissionais que 
                    foram salvos anteriormente*/}

                    {/*queria que caso, o sistema reconhecesse com o token, desde que não fosse o próprio usuário, ele mostra o botçao de salvar, caso
                    seja o próprio perfil, ele permite que esse botão, ao invés de salvar, seja um botão para mudar para o modo de edição*/}
                    <div className="salvaroueditar">
                        <div className="salvarPerfil">
                            <button className="salvarProf">Salvar</button>
                            <img src={salvar} alt="" className="iconeSalvar"/>
                        </div>

                    </div>
                </div>
                {/*Aqui vamos ter uma lógica complicada, afinal teremos 1 página com a estrura quase igual, mas uma pra profissionais e outra pra clientes */}
                <div className="infoPerfil">
                        <label>Especialidades:</label>
                        <ul>
                            <li>Especialidade1</li>
                            <li>Especialidade1</li>
                            <li>Especialidade1</li>
                        </ul>
                    </div>
                    {/*Aqui vai ser uma das maiores dores de cabeça, pois aqui quero um calendario que permita o cliente escolher uma data e horário, clicar nele e solicitar um agendamneto para 
                    um profissional da saúde (quer será enviado uma notificação para ele, permitindo ele escolher se vai aceitar ou não aquela data, se for aceita
                    manda novos dados para página de agendamentos, com data do agendamento, horário e quem vai participar, e depois a forma de pagamento*/}
                    <div className="calendarioAgendamento">
                        <h1>Provavelmente um componente muito sinistro que nem eu sei como fazer</h1>
                    </div>

                    <div className="SobreProfissional">
                        <h1>Sobre o nomeProfissional</h1>
                        <hr />
                        <p>Super texto daora aonde o próprio usuário irá editar</p>
                        {/*botãozinho que aumenta o tamanho da div caso o texto inserido seja muito grande */}
                        <button>ver mais</button>
                    </div>

                    <div className="formacoesAcademicas">
                        {/*Na aba de edição, essa parte deve permitir que o profissional possa adicionar, editar e excluir quantas formações ele queira, permita ele adicionar um 
                        doc, que tem a vizualização prévia dele, fale pra ele falar o que é a formação, unidade onde se formou e ano que se formou*/}
                        <div className="formacao">
                            {/* nessa img, deve conter a img prévia de um documento png, pdf, etc do certificado registrado pelo profissional*/}
                            <img src="" alt="" />
                            <div className="infoFormacao">
                                <h2>Graduação em Psicologia</h2>
                                <p>Unidade de formação</p>
                                <p>Ano de conclusão</p>
                            </div>
                        </div>
                    </div>

                    {/*Essa será uma div opicional, o profissionaal pode escolher adicionar ela a seu perfil ou não (caso tenha ou nn consultorio presencial)*/}
                    <div className="FotosConsultoriopresencial">
                        <div className="TituloConsultorio">
                            <h2>Consultório presencial</h2>
                            <p>|</p>
                            <p>Endereço do Consultorio</p>
                        </div>
                        {/*Aqui deve permitir que o usuário adicione fotos do consultório presencial*/}
                        <img src="" alt="" />
                        <img src="" alt="" />
                        <img src="" alt="" />
                    </div>

                    <div className="avaliacoes">
                        {/*Quero fazer tipo um carrossel de avaliações, mostrando pelo menos 3 avaliações numa tela, aperta no botão direito e o 
                        botão esquero aparece, mostra mais 3, e depois mais 3 e chega, mostrando apenas as 9 últimas que foram realizadas sabe?*/}
                        <button className="irEsquerda">Esquerda</button>
                        <div className="tituloavaliacoes">
                            <h2>Avaliações</h2>
                            <p>|</p>
                            <p>Confira os Feed Backs de outros pacientes de nomeProfissional</p>
                        </div>

                        {/*aqui será mostrado avaliações de outros usuários, que após fazerem a video-chamada com o profissional, perrmita que eles vão para uma tela 
                        de feedback, deixem comentários e entre 0 a 5 estrelas, e possa após, ser vizualizado no perfil pessoal e num cardzinho que terá na tela de profissionais (nos filtros)
                        fazendo tipo uma média e de quantas pessoas os avaliaram sabe?*/}
                        <div className="avaliacao">
                            <h2>nomeCliente</h2>
                            <hr />
                            <p>Comentário</p>
                            <div className="estrelinhas">
                                {/*Ainda não sei fazer um sistema de feedback, mas aqui, deveria ficar as estrelinhas da avaliaçã */}
                            </div>
                        </div>
                        <button className="irDireita">Direita</button>
                    </div>

            </div>
        )
    {/**
    const { usuario, token, carregando: carregandoAuth } = useAuth();
    const navigate = useNavigate();

    const [ perfil, setPerfil ] = useState<PerfilUsuario | null>(null);
    const [ carregandoPerfil, setCarregandoPerfil ] = useState(true);
    const [ erro, setErro ] = useState<string>('');
    const [ salvando, setSalvando] = useState(false);
    const [mensagemSucesso, setMensagemSucesso ] = useState('');

    //Redirecionamento caso não estiver logado
    useEffect(() => {
        if (!carregandoAuth && !usuario){
            navigate('/Autenticacao');
        }
    }, [carregandoAuth, usuario, navigate]);

    //Efeito para buscar os dados do backend
    useEffect(() => {
        if (usuario && token){
            const buscaPerfil = async () => {
                try {
                    const res = await fetch('http://localhost:5000/api/usuarios/perfil', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-type': 'application/json',
                        },
                    });
                    const data: PerfilUsuario = await res.json();

                    if (!res.ok) throw new Error((data as BackendError).msg || 'Falha ao carregar perfil.');
                    
                    if(data.tipoUsuario === 'Profissional' && !data.infoProfissional){
                        data.infoProfissional = { especialidades: []};
                    }
                    if(!data.infoCliente){
                        data.infoCliente = {};
                    }

                    setPerfil(data);
                } catch (e: any) {
                    setErro(e.message);
                } finally {
                    setCarregandoPerfil(false);
                }
            };
            buscaPerfil();
        }
    }, [usuario, token]);

    //Constante para lidar com atualizações no perfil do usuario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!perfil || !token) return;
        setSalvando(true);
        setErro('');
        setMensagemSucesso('');

        try{
            const dadosParaEnviar: any = {
                telefoneContato: perfil.telefoneContato,
                genero: perfil.genero,
                fotoPerfil: perfil.fotoPerfil,
            };
            if(perfil.tipoUsuario === 'Profissional' && perfil.infoProfissional){
                dadosParaEnviar.infoProfissional = perfil.infoProfissional;

            }
            if (perfil.infoCliente){
                dadosParaEnviar.infoCliente = perfil.infoCliente;
            }

            const res = await fetch('http://localhost:5000/api/usuarios/perfil', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosParaEnviar),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Falha ao salvar o perfil.');

            setMensagemSucesso('Perfil atualizado com sucesso!');
        } catch(e: any){
            setErro(e.message);
        } finally {
            setSalvando(false);
        }
    }
    //Handler para des gerenciar a seleção de múltiplas especialidades
        const handleEspecialidadeChange = (especialidade: string, isCheked: boolean) => {
            if (!perfil || perfil.tipoUsuario !== 'Profissional' || !perfil.infoProfissional) return;

            let especialidadesAtuais = perfil.infoProfissional.especialidades || [];

            if (isCheked){
                if (!especialidadesAtuais.includes(especialidade)){
                    especialidadesAtuais = [...especialidadesAtuais, especialidade];
                }
            } else {
                especialidadesAtuais = especialidadesAtuais.filter(e => e !== especialidade);
            }

            setPerfil({
                ...perfil,
                infoProfissional: {
                    ...perfil.infoProfissional,
                    especialidades: especialidadesAtuais,
                }
            });
        };

        if(carregandoAuth || carregandoPerfil){
            return <div className="loading">Carregando perfil...</div>;
        }
        if(erro && !salvando){
            return <div className="erroContainer">Nennhum perfil encontrado.</div>
        }
        if(!perfil){
            return <div className="erroContainer">Nenhum perfil encontrado. Por favor, faça login!</div>
        }
        */}
        

}

