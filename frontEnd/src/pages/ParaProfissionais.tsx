import './ParaProfissionais.css'
import profissionalPgParaProfissionais from '../assets/imgParaProfissionais.png'
import { useNavigate } from 'react-router-dom';

const Paraprofissionais = () => {
    const navigate = useNavigate();

    const irParaCadastroProfissional = () => {
        navigate('/Autenticacao?modo=cadastroProfissional');
    }

    return (
        <div className="paraProfissionais">

            <div className="Paraproftela1">
                <div className="containerparaprof1">
                    <h1>Trabalhe com a YSV</h1>
                    <h2>Impulsione seus atendimentos <br />com a YSV</h2>
                    <hr />
                    <p>
                        Nossa plataforma prioriza a qualidade de atendimento na hora de realizar uma consulta,
                        conectando profissionais e pacientes de forma prática e segura.
                    </p>
                    <button onClick={irParaCadastroProfissional}>
                        Registre-se como profissional
                    </button>
                </div>

                <img src={profissionalPgParaProfissionais} alt="Profissional YSV" />
            </div>

            <div className="containerParaProfissionais">
                <div className="tituloCrieperfil">
                    <h1>Crie seu perfil e conte com recursos que facilitam seu trabalho</h1>
                </div>

                <ul>
                    <li>Divulgação profissional completa</li>
                    <li>Gestão prática de agendamentos</li>
                    <li>Pagamentos integrados de consultas</li>
                    <li>Comunicação segura com pacientes por chat e vídeo chamada</li>
                </ul>

                <div className="ProjetoYSV"></div>
                <div className="tituloysv">
                    <h1>YSV - Saúde Mental</h1>
                </div>
                <div className="textoYSV">
                    <p>
                        Na YSV, nosso objetivo é elevar a qualidade dos atendimentos e proporcionar uma experiência única
                        para todos os clientes que buscam acompanhamento psicológico de excelência. Cuidar da saúde mental
                        nunca foi tão acessível e prático, unindo tecnologia, segurança e humanização em um só lugar.
                    </p>
                        <br /><br />
                    <p>
                        Para profissionais da área de saúde, oferecemos uma plataforma completa para impulsionar sua carreira
                        no mundo digital. Com ferramentas modernas de gestão, agendamento e comunicação com pacientes, você
                        consegue se concentrar no que realmente importa: prestar um atendimento de qualidade e expandir sua presença profissional.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Paraprofissionais
