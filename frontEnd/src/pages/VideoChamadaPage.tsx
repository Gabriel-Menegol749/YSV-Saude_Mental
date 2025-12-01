import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { useAuth } from "../contextos/ContextoAutenticacao";

import logoYsv from '../assets/logoYSV.png';
import fotoPerfil from '../assets/profile-circle-svgrepo-com.svg';
import microfone from '../assets/telaVideoChamada/microfone.png';
import microfoneDesligado from '../assets/telaVideoChamada/NOmicrofone.png';
import camera from '../assets/telaVideoChamada/camera.png';
import cameraDesligada from '../assets/telaVideoChamada/NoCamera.png';
import telefone from '../assets/telaVideoChamada/telephone.png';
import telefoneHover from '../assets/telaVideoChamada/telephoneHover.png';

import './videoChamadaPage.css';

export  default function VideoChamadaPage() {

  return(
    <div className="telVideoChamada">
      <header className="CabecalhoChamada">
        {/*Ao clicar nesse maninho, ele permite voltarmos para a tela home (/), mas tem que ter um alert perguntando se quer isso memo*/}
        <img src={logoYsv} alt="Logo YSV" className="logoYSVchamada"/>
        <h1>NomeUsuario do outro lado</h1>
      </header>

      <div className="telaVideoChamada">
        {/*Botar aqui tipo, uma tela inteira onde pode renderizar a imagem capturada da câmera do outro usuário*/}
        {/*mas nesse img aqui, termos a foto dele, ou a foto default que seria a profile svg ali*/}
        <img src="" alt="" />

        <div className="telaProprioUser">
          {/*Ai dentro dessa telinha, ter quase a mesma coisa, uma tela menor de posição absoluta onde tem o nome nossa foto 
          de perfil ou a foto default, e caso estivermos com nossa câmera do notebook ligada, ele mostra na div nossa visão
          */}
          <img src={fotoPerfil} alt="" />
          <footer className="footerVideoChamada">
            <h2>Nome do Usuario Logado</h2>
          </footer>

          <footer className="footerVideoChamada">
            {/*Aqui nosso microfone, que deve começar com ele desativado, e quando for ativado, ele reconhecer a entrada de microfone
            do notebook da pessoa e trocar para foto do microfone sem estar com uma linha em cima*/}
            <img src={microfone} alt="" />
            {/*Esse aqui tbm tem que começar desativado, e quando ativado, troca para a img original e liga a nossa camera pra aparecer
            ali no telaproprio user */}
            <img src={camera} alt="" />
            {/*Esse mano aqui, quando for apertado, deve desligar a vídeo chamada e retornar para a tela de conversas */}
            <img src={telefone} alt="" />
          </footer>
        </div>
      </div>
    </div>
  )
}