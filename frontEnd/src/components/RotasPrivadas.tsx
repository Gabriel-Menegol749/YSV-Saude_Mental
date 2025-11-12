import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contextos/ContextoAutenticacao";

interface RotaPrivadaProps{
    children: ReactElement;
}

export function RotasPrivadas({ children}: RotaPrivadaProps ){
    const {usuario, carregando} = useAuth();

    if(carregando){
        return <p>Carregando...</p>;
    }
    if(!usuario){
        return <Navigate to="/Autenticacao?modo=login" replace />
    }

    return children;
}