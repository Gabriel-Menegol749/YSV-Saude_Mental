import './Agendamentos.css'

import fotoPefil from '../assets/profile-circle-svgrepo-com.svg'
const Agendamentos = () =>{
    return(
        <div className="TeladAgendamentos">

            {/*A div solicitacoes e consultas, ambas devem ser preenchidas pelos dados dos usuários que foram solicitados
            e com certeza, caso haja mais consultas ou mais solicitações, todas devem aparecer na tela */}

            <div className="solicitacoesAgendamento">
                <div className="tituloSolicitacoesAgendamento">
                    <h1>Solicitações de Agendamentos:</h1>
                </div>
                <div className="Solicitacoes">
                    {/*Data e Horario da solicitação que foi enviada para o profissional*/}
                    <h1>Solicitação: 03 de Novembro de 2025, 10:00</h1>
                    <hr />
                    <div className="InfoUsuarioSolicitacao">
                        
                        <div className="FotoPerfil">
                                {/*Colocar essa foto perfil como default*/}
                                <img src={fotoPefil} alt="" />
                            </div>
                        <div className="containerSolic">

                            <div className="infoUser">
                                {/*Se for psiquiatra, Psicólogo ou Pacientes*/}
                                <p>Profissão</p>
                                <h2>Nome Usuário</h2>
                                <p>crp - se for profissional</p>
                                <a href="">Ver perfil completo</a>

                                <h2>Agendamento:</h2>
                                <p>Modalidade de agendamento, presencial ou online</p>
                            </div>
                        </div>

                        <div className="opcoes">
                            <button className="ReagendarAgendamento">Reagendar Agendamento</button>
                            <button className="RecursarAgendamento">Recusar Agendamento</button>
                            <button className="AceitarAgendamento">Aceitar Agendamento</button>
                        </div>

                    </div>
                </div>
            </div>

            
            <div className="consultasAgendadas">
                <div className="tituloConsulta">
                    <h1>Solicitações de Agendamentos:</h1>
                </div>
                <div className="Consulta">
                    {/*Data e Horario da solicitação que foi enviada para o profissional*/}
                    <h1>Solicitação: 03 de Novembro de 2025, 10:00</h1>
                    <hr />
                    <div className="infoUsuarioConsulta">
                        <div className="FotoPerfil">
                                {/*Colocar essa foto perfil como default*/}
                                <img src={fotoPefil} alt="" />
                            </div>
                        <div className="containerSolic">

                            <div className="infoUser">
                                {/*Se for psiquiatra, Psicólogo ou Pacientes*/}
                                <p>Profissão</p>
                                <h2>Nome Usuário</h2>
                                <p>crp - se for profissional</p>
                                <a href="">Ver perfil completo</a>

                                <h2>Agendamento:</h2>
                                <p>Modalidade de agendamento, presencial ou online</p>
                            </div>
                        </div>

                        <div className="opcoes">
                            <button className="ReagendarAgendamento">Reagendar Agendamento</button>
                            <button className="RecursarAgendamento">Recusar Agendamento</button>
                            <button className="AceitarAgendamento">Aceitar Agendamento</button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default Agendamentos;