import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import './PerfilPessoal.css'

//Importação dos componentes das seções do perfil
import DadosPessoais from '../components/componentesPerfilPessoal/DadosPessoais.tsx'
import SobreMim from '../components/componentesPerfilPessoal/SobreMim.tsx'
import FormacaoAcademica from '../components/componentesPerfilPessoal/FormacaoAcademica.tsx'
import FotosConsultorios from '../components/componentesPerfilPessoal/FotoConsultorio.tsx'
import Avaliacoes from '../components/componentesPerfilPessoal/Avaliacoes.tsx'
import NovaSecao from '../components/componentesPerfilPessoal/NovaSecao.tsx'
import { useAuth } from "../contextos/ContextoAutenticacao.tsx";

interface PerfilPessoalProps {
    modo?: "visualizacao" | "edicao";
}

interface Usuario {
  _id: string;
  nome: string;
  tipoUsuario: "Cliente" | "Profissional";
  profissao?: string;
  crp?: string;
  sobre?: string;
  formacoes?: any[];
  fotosConsultorio?: string[];
  avaliacoes?: any[];
}

interface SecaoPersonalizada {
  titulo: string;
  conteudo: string;
}

const PerfilPessoal = ({ modo = "visualizacao"}: PerfilPessoalProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [dadosUsuario, setDadosUsuario] = useState<Usuario | null>(null);
  const [modoAtual, setModoAtual] = useState<"visualizacao" | "edicao">(modo);
  const [secoesPersonalizadas, setSecoesPersonalizadas] = useState<SecaoPersonalizada[]>([]);

  const isMeuPerfil = usuario?._id === id;

  useEffect(() => {
      const carregarDados = async () => {
          try{
              const respostaFakeParatestes: Usuario = {
                  _id: id || "1",
                  nome: "Dra. Júlia Andrade",
                  tipoUsuario: "Profissional",
                  profissao: "Psicóloga Clínica",
                  crp: "CRP 12/34567",
                  sobre:
                      "Psicóloga especializada em terapia cognitivo-comportamental, atuando há mais de 8 anos com foco em ansiedade e depressão.",
                  formacoes: [
                      { curso: "Psicologia", instituicao: "UFRGS", anoConclusao: "2016" },
                      { curso: "Pós em TCC", instituicao: "PUCRS", anoConclusao: "2019" },
                  ],
                  fotosConsultorio: [],
                  avaliacoes: [],
              };
              setDadosUsuario(respostaFakeParatestes);
          } catch(error){
              console.error("Erro ao Carregar perfil:", error);
          }
      };

      carregarDados();
  }, [id]);

  const alternarModo = () => {
      if (!isMeuPerfil) return;
      if (modoAtual === 'visualizacao'){
          navigate(`/perfil/${id}/editar`);
          setModoAtual("edicao");
      } else {
          navigate(`/perfil/${id}`);
          setModoAtual("visualizacao");
      }
  };

  const adicionarSecao = (titulo: string, conteudo: string) => {
      setSecoesPersonalizadas([...secoesPersonalizadas, { titulo, conteudo }]);
  };

  if(!dadosUsuario) return <p>Carregando Perfil...</p>

  return (
      <div className="perfil-pessoal-container">
        {/* Seções principais do perfil */}

        <DadosPessoais
            usuario={dadosUsuario}
            modo={modoAtual}
            onToggleEdicao={() => {
                if (modoAtual === "edicao") {
                setModoAtual("visualizacao");
                navigate(`/perfil/${id}`);
                } else {
                setModoAtual("edicao");
                navigate(`/perfil/${id}/editar`);
                }
        }}
        />

          <SobreMim usuario={dadosUsuario} modo={modoAtual} />

        {dadosUsuario.tipoUsuario === "Profissional" && (
          <>
            <FormacaoAcademica usuario={dadosUsuario} modo={modoAtual} />
            <FotosConsultorios usuario={dadosUsuario} modo={modoAtual} />
            <Avaliacoes usuario={dadosUsuario} modo={modoAtual} />
          </>
        )}

        {/* Seções personalizadas adicionadas */}
        {secoesPersonalizadas.map((secao, index) => (
          <div key={index} className="secao-personalizada">
            <h2>{secao.titulo}</h2>
            <hr />
            <p>{secao.conteudo}</p>
          </div>
        ))}

        {/* Botão / formulário da nova seção */}
        {isMeuPerfil && (
          <NovaSecao modo={modoAtual} onAddSecao={adicionarSecao} />
        )}
      </div>

  );
};

export default PerfilPessoal;
