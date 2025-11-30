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
        <img src={logoYsv} alt="Logo YSV" className="logoYSVchamada"/>
        <h1>NomeUsuario do outro lado</h1>
      </header>

      <div className="telaVideoChamada">
        <img src="" alt="" />
      </div>
    </div>
  )
}