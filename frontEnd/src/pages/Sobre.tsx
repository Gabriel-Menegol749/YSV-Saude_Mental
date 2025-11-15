import imgProf from '../assets/sobrePageIMGPROF.png'
import imgProfCliente from '../assets/profissionalCliente.png'

import './Sobre.css'
const Sobre = () => {
    return(
        <div className="pgSobre">
            <div className="telaInicial">
                <img src={imgProf} alt="Plataforma YSV" className='FotoProfissional'/>
                <div className="textoIntroducao">
                    <div className="textoApresentacao">
                        <h1>Saúde mental é uma necessidade báscia para qualidade de vida</h1>
                        <hr />
                        <p>

                            A <strong>YSV</strong> é uma plataforma digital voltada ao cuidado com a saúde mental, desenvolvida
                            com o objetivo de conectar profissionais qualificados a pessoas que buscam acompanhamento psicológico
                            acessível e confiável.
                        </p>

                        <p>
                            Acreditamos que cuidar da mente deve ser algo simples e possível para todos, independentemente da região
                            ou da condição financeira. Por isso, nossa proposta é facilitar o acesso a consultas, orientações e
                            informações sobre bem-estar emocional através de uma experiência prática, intuitiva e acolhedora.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mercadoDeTrabalho">
                <div className="tituloMercadoSobre">
                <h1>Mercado de Trabalho</h1>
                </div>

                    <div className="mercadoDtrabalhoContainer">
                        <div className="textoMercadoDTrabalho">
                            <p>
                                Hoje, o mercado de trabalho na área da saúde mental está em constante transformação.
                                O avanço da tecnologia e a popularização dos atendimentos online tornaram o acompanhamento
                                psicológico mais acessível e prático, permitindo que profissionais alcancem pessoas em qualquer lugar do país.
                            </p>
                            <br />
                            <p>
                                Nesse cenário, a YSV surge como uma ferramenta de apoio tanto para profissionais quanto para pacientes.
                                A plataforma oferece recursos que facilitam o agendamento de consultas, o contato direto e o gerenciamento
                                de atendimentos, otimizando o tempo e ampliando as possibilidades de crescimento para quem atua na área da
                                psicologia e do bem-estar emocional.
                            </p>
                        </div>
                        <div className="fotoMercadoDTrabalho">
                            <img src={imgProfCliente} alt="" className='imgProfissionalPaciente'/>
                        </div>
                    </div>
            </div>

            <div className="saudeMental">
                <div className="tituloSaudeMental">
                    <h1>Saúde mental nos dias de hoje</h1>
                </div>
                <div className="conteudoSaudeMental">
                    <div className="textosLaterais">
                        <p>
                            A saúde mental se tornou um dos pilares mais importantes da qualidade de vida moderna.
                            Com rotinas cada vez mais aceleradas, pressões acadêmicas e profissionais, e o impacto das
                            redes sociais, problemas emocionais se tornaram muito mais comuns — e muito menos visíveis.
                        </p>
                        <br />
                        <p>
                            Quando esses cuidados são ignorados, o impacto não é apenas individual. Relações pessoais,
                            ambiente de trabalho, desempenho nos estudos e até a saúde física são afetados diretamente.
                            Por isso, entender e valorizar a saúde mental deixou de ser um diferencial: virou uma necessidade
                            básica para que qualquer pessoa consiga viver com equilíbrio e bem-estar.
                        </p>
                    </div>
                    <div className="pesquisas">
                        <p>Organização Pan-Americana aponta que mais de 80% da população que possuia uma questão de severa de saúde mental não recebeu tratamento adequado.</p>
                        <a href="https://news.un.org/pt/story/2023/06/1816007" target="_blank" rel="noopener noreferrer">ONU News: Mais de 80% das pessoas com casos severos estão sem tratamento</a>
                        <p>Pesquisas reaizadas pela Organização Mundial da Saúde (OMS) indicam que casos de ansiedade e derpessão se intensificaram em até 28% no seu primeiro ano.</p>
                        <a href="https://www.who.int/news-room/fact-sheets/detail/mental-disorders" target="_blank" rel="noopener noreferrer">Organização Mundial da Saúde: Transtornos Mentais</a>
                    </div>
                </div>
            </div>

            <div className="ProjetoYSV">
                <div className="titutloProjeto">
                    <h1>O projeto YSV</h1>
                </div>
                <div className="textoProjeto">
                <p>O projeto YSV surgiu como um Trabalho de Conclusão de Curso no Instituto Federal do Rio Grande do Sul no ano de 2025 pelo aluno Gabriel Santos Menegol

                    A ideia deste projeto surgiu em homenagem a psicóloga que atua a anos como profissional na área da saúde na modalidade online, que buscava uma ferramenta eficiente para divulgação de seus serviços e busca de novos clientes
                    Tamara dos Santos Vieira

                    Este Projeto tem como inspiração uma pessoa muito importante para o desenvolvedor dele
                    Em homenagem a Yago dos Santos Vieira</p>
                </div>
            </div>
        </div>
    )
}

export default Sobre;
