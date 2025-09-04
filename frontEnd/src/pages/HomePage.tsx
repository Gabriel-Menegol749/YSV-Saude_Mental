import React from "react";
import Cabecalho from '../components/Cabecalho.tsx';
import Rodape from "../components/rodape.tsx"

const HomePage = () =>{
    return(
        <div>
            <Cabecalho />
            <h1>Seja bem vindo a YSV!</h1>
            <p>A sua plataforma de agendamento de consultas favorita</p>
            <Rodape />
        </div>
    )
}

export default HomePage;