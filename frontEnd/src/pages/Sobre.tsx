import imgProf from '../assets/sobrePageIMGPROF.png'
import './Sobre.css'
const Sobre = () => {
    return(
        <div className="pgSobre">
            <h1>Sobre a YSV</h1>
            <div className="telaInicial">
                <img src={imgProf} alt="Plataforma YSV" />
                <div className="textoIntroducao">
                    <h2>Saúde mental é uma necessidade báscia para qualidade de vida</h2>
                    <p>A ysv é uma plataforma que visa auxiliar pessoas que buscam tratamento adequado e 
                        acessibilidade em qualquer lugar do Brasil para disponibilizar serviços de cuidados com a saúde mental</p>
                </div>
            </div>

            <div className="mercadoDeTrabalho">
                <h1>Mercado de Trabalho</h1>
                <p>Hoje em dia, agendamentos de consultas e atendimentos on-line dispararam com o avanço da tecnologia e a disponibilidade que ela proporciona</p>
                <p>A YSV visa auxiliar profissionais a alavancar sua carreira e utilizar suas ferramentas para otimizar seu serviço</p>
            </div>

            <div className="saudeMental">
                <h2>Saúde mental nos dias de hoje</h2>
                <div className="textosLaterais">
                    <p>Diversas pesquisas mostram como a falta dos cuidados com saúde mental podem afetar a sociedade como um todo</p>
                    <p>Hoje em dia saúde mental é algo que não pode ser ignorado ou negligênciado, saúde mental é qualidade de vida</p>
                </div>
                

                <ul>
                    
                    <li>
                        <p>Organização Pan-Americana aponta que mais de 80% da população que possuia uma questão de severa de saúde mental não recebeu tratamento adequado.</p>
                        <a href="https://news.un.org/pt/story/2023/06/1816007" target="_blank" rel="noopener noreferrer">ONU News: Mais de 80% das pessoas com casos severos estão sem tratamento</a>
                    </li>
                    <li>
                        <p>Pesquisas reaizadas pela Organização Mundial da Saúde (OMS) indicam que casos de ansiedade e derpessão se intensificaram em até 28% no seu primeiro ano.</p>
                        <a href="https://www.who.int/news-room/fact-sheets/detail/mental-disorders" target="_blank" rel="noopener noreferrer">Organização Mundial da Saúde: Transtornos Mentais</a>
                    </li>
                    <li>
                        <p>não sei o que colocar aqui</p>
                        <a href="https://www.paho.org/pt/noticias/17-6-2022-oms-destaca-necessidade-urgente-transformar-saude-mental-e-atencao" target="_blank" rel="noopener noreferrer">OMS: Necessidade urgente de transformar a saúde mental</a></li>
                </ul>
            </div>

            <div className="ProjetoYSV">
                <h1>O projeto YSV</h1>
                <p>O projeto YSV surgiu como um Trabalho de Conclusão de Curso no Instituto Federal do Rio Grande do Sul no ano de 2025 pelo aluno Gabriel Santos Menegol

                    A ideia deste projeto surgiu em homenagem a psicóloga que atua a anos como profissional na área da saúde na modalidade online, que buscava uma ferramenta eficiente para divulgação de seus serviços e busca de novos clientes
                    Tamara dos Santos Vieira

                    Este Projeto tem como inspiração uma pessoa muito importante para o desenvolvedor dele
                    Em homenagem a Yago dos Santos Vieira</p>
</div>
        </div>
    )
}

export default Sobre;
