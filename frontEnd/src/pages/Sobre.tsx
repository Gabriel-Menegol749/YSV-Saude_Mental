import imgProf from '../assets/sobrePageIMGPROF.png'

const Sobre = () => {
    return(
        <div className="pgSobre">
            <h1>Sobre a YSV</h1>
            <div className="telaInicial">
                <img src={imgProf} alt="Plataforma YSV" />
                <div className="textoIntroducao">
                    <h2>Saúde Mental é essencial para uma vida equilibrada</h2>
                    <p>A YSV é uma plataforma que conecta pessoas a profissionais de saúde mental, oferecendo agendamento prático, atendimento seguro e acesso facilitado a qualquer lugar do Brasil.</p>
                </div>
            </div>

            <div className="mercadoDeTrabalho">
                <h1>Mercado de Trabalho</h1>
                <p>O projeto YSV também auxilia profissionais da área a divulgarem seus serviços e alcançarem novos clientes, ajudando a alavancar a carreira e fortalecer a presença digital no mercado de saúde mental.</p>
            </div>

            <div className="saudeMental">
                <h2>Saúde mental nos dias de hoje</h2>
                <p>Nos dias atuais, cuidar da saúde mental é mais importante do que nunca. Negligenciar questões emocionais pode ser debilitante e impactar negativamente a vida pessoal, profissional e social de qualquer pessoa.</p>

                <ul>
                    <p>Pesquisas e artigos relevantes:</p>
                    <li><a href="https://www.who.int/news-room/fact-sheets/detail/mental-disorders" target="_blank" rel="noopener noreferrer">Organização Mundial da Saúde: Transtornos Mentais</a></li>
                    <li><a href="https://news.un.org/pt/story/2023/06/1816007" target="_blank" rel="noopener noreferrer">ONU News: Mais de 80% das pessoas com casos severos estão sem tratamento</a></li>
                    <li><a href="https://www.paho.org/pt/noticias/17-6-2022-oms-destaca-necessidade-urgente-transformar-saude-mental-e-atencao" target="_blank" rel="noopener noreferrer">OMS: Necessidade urgente de transformar a saúde mental</a></li>
                </ul>
            </div>

            <div className="ProjetoYSV">
                <h1>O projeto YSV</h1>
                <p>YSV foi desenvolvido como Trabalho de Conclusão de Curso no Instituto Federal do Rio Grande do Sul em 2025, pelo aluno Gabriel Santos Menegol, sob orientação do professor Gabriel Paniz Patzer.</p>
                <p>O projeto tem um significado pessoal: inspirado na necessidade de Tamara dos Santos Vieira, profissional de saúde mental que atua online e presencialmente, a plataforma oferece uma ferramenta prática para divulgação de serviços e conexão com pacientes. O nome YSV homenageia o filho de Tamara, Yago dos Santos Vieira.</p>
            </div>
        </div>
    )
}

export default Sobre;
