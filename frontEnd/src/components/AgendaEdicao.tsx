import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AgendaEdicao.css";

const AgendaEdicao: React.FC = () => {
  const navigate = useNavigate();

  const [horaInicioDia, setHoraInicioDia] = useState("07:00");
  const [horaFimDia, setHoraFimDia] = useState("23:00");
  const [atendeSabados, setAtendeSabados] = useState(false);
  const [atendeDomingos, setAtendeDomingos] = useState(false);


  const handleCancelar = () => {
    navigate(-1);
  };

  const handleSalvar = async () => {
    alert("Salvar ainda vai ser implementado");
    navigate(-1);
  };

  return (
    <div className="pagina-edicao-agenda">
      <header className="header-edicao-agenda">
        <h2>Edição da agenda</h2>
        <div className="acoes-header">
          <button className="btn-salvar" onClick={handleSalvar}>
            Salvar
          </button>
          <button className="btn-cancelar" onClick={handleCancelar}>
            Cancelar
          </button>
        </div>
      </header>

      <div className="layout-edicao-agenda">
        <section className="grid-horarios">
          <p>Grid de horários vai aqui</p>
        </section>

        <aside className="painel-config-horarios">
          <div className="bloco-config">
            <h4>Seu horário de serviço</h4>
            <label>
              Começa às:
              <input
                type="time"
                value={horaInicioDia}
                onChange={e => setHoraInicioDia(e.target.value)}
              />
            </label>
            <label>
              Termina às:
              <input
                type="time"
                value={horaFimDia}
                onChange={e => setHoraFimDia(e.target.value)}
              />
            </label>
          </div>

          <div className="bloco-config">
            <h4>Você atende nos finais de semana?</h4>
            <label>
              <input
                type="checkbox"
                checked={atendeSabados}
                onChange={e => setAtendeSabados(e.target.checked)}
              />
              Sábados
            </label>
            <label>
              <input
                type="checkbox"
                checked={atendeDomingos}
                onChange={e => setAtendeDomingos(e.target.checked)}
              />
              Domingos
            </label>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AgendaEdicao;
