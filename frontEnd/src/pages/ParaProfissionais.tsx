import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const Paraprofissionais = () => {
    const [filtrosAtivos, setFiltrosAtivos  ] = useState([]);
    const location = useLocation();

    useEffect(() => {
        if(location.state && location.state.filtrosAtivos){
            setFiltrosAtivos(location.state.filtrosAtivos);
        }
    }, [location.state]);

    return(
        <h3>Para profissionais, ofertando profissionais da saúde a usar a YSV</h3>
    )
}

export default Paraprofissionais;