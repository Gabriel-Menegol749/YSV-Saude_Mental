import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contextos/ContextoAutenticacao';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './Agenda.css'; // Importa o CSS da agenda

// Tipagem para os dados que vêm do backend
interface SlotsDisponiveis {
    slotsPorDia: { [dia: string]: string[] }; // Ex: { 'Segunda': ['09:00', '10:00'], ... }
    valorConsulta: number;
    duracao_Sessao: number;
    mensagem?: string;
}

interface AgendaProps {
    profissionalId: string;
    isOwner?: boolean; 
}

// Mapeamento dos dias da semana (usado para corresponder ao backend)
const diasSemanaMap: { [key: number]: string } = {
    0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado'
};

const Agenda: React.FC<AgendaProps> = ({ profissionalId, isOwner = false }) => {
    const { token } = useAuth();
    
    // Inicia a semana na segunda-feira da semana atual
    const [semanaInicio, setSemanaInicio] = useState<Date>(
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );
    const [slotsData, setSlotsData] = useState<SlotsDisponiveis | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string>('');
    const [slotSelecionado, setSlotSelecionado] = useState<{ date: Date | null, horario: string | null }>({ date: null, horario: null });
    const [modalidade, setModalidade] = useState<'online' | 'presencial'>('online');


    // FUNÇÃO DE BUSCA DE SLOTS NO BACKEND
    const buscarSlots = useCallback(async (dataInicio: Date) => {
        setCarregando(true);
        setErro('');
        
        const dataInicioString = format(dataInicio, 'yyyy-MM-dd');

        try {
            const url = `http://localhost:5000/api/agendamentos/slots/${profissionalId}?dataInicio=${dataInicioString}`;
            const res = await fetch(url);
            
            const data: SlotsDisponiveis = await res.json(); 

            if (!res.ok) {
                throw new Error(data.mensagem || "Falha ao carregar a agenda."); 
            }
            setSlotsData(data); 

        } catch (e: any) {
            console.error("Erro ao buscar slots:", e);
            // setErro(e.message || "Erro de conexão ao buscar horários."); // Comentado para não poluir demais a UI
            setSlotsData(null);
        } finally {
            setCarregando(false);
        }
    }, [profissionalId]);

    useEffect(() => {
        if (profissionalId) { // Garante que só busca se tiver o ID
            buscarSlots(semanaInicio);
        }
    }, [semanaInicio, buscarSlots, profissionalId]);

    // NAVEGAÇÃO DE SEMANA
    const mudarSemana = (dias: number) => {
        setSemanaInicio(prev => addDays(prev, dias));
        setSlotSelecionado({ date: null, horario: null });
    };

    // FUNÇÃO DE SOLICITAÇÃO DE AGENDAMENTO
    const handleSolicitar = async () => {
        if (!slotSelecionado.date || !slotSelecionado.horario || !token) {
            alert("Selecione um horário para agendar e faça login.");
            return;
        }
        
        // Cria a data e hora no formato ISO
        const dataHoraCompleta = format(slotSelecionado.date, 'yyyy-MM-dd') + `T${slotSelecionado.horario}:00.000Z`;

        const dadosSolicitacao = {
            ID_Profissional: profissionalId,
            dataHorario_Consulta: dataHoraCompleta,
            tipoModalidade: modalidade,
        };
        
        setCarregando(true);

        try {
            const res = await fetch('http://localhost:5000/api/agendamentos/solicitar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosSolicitacao),
            });
            
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.mensagem || "Não foi possível solicitar o agendamento.");
            }
            
            alert("Solicitação enviada com sucesso! Aguarde a confirmação.");
            setSlotSelecionado({ date: null, horario: null });
            buscarSlots(semanaInicio); // Recarrega
        } catch (e: any) {
            alert(e.message);
        } finally {
            setCarregando(false);
        }
    };
    
    // 🚨 VERIFICAÇÃO DE SEGURANÇA (Adição Crucial)
    if (!profissionalId) {
        return <div className="erro-agenda">Erro: ID do Profissional não fornecido.</div>;
    }
    // ---------------------------------------------
    
    // Renderização de carregamento
    if (carregando && !slotsData) return <div className="loading-agenda">Carregando Agenda...</div>;

    // LÓGICA DE RENDERIZAÇÃO
    const renderSlots = () => {
        const diasDaSemana = [];
        // Itera 7 vezes, começando na semanaInicio
        for (let i = 0; i < 7; i++) {
            const dataAtual = addDays(semanaInicio, i);
            const nomeDia = diasSemanaMap[dataAtual.getDay()]; 
            
            // Garantindo que slotsData e slotsPorDia existam antes de acessar
            const slotsDoDia = slotsData?.slotsPorDia?.[nomeDia] || [];

            // Renderiza apenas dias úteis (Segunda a Sexta) para replicar a imagem
            if (dataAtual.getDay() === 0 || dataAtual.getDay() === 6) continue;
            
            diasDaSemana.push(
                <div key={i} className="dia-coluna">
                    {/* Header do Dia (Seg 13 Out) */}
                    <div className="dia-header-wrapper">
                        <h3 className={`dia-nome ${isSameDay(dataAtual, new Date()) ? 'hoje' : ''}`}>
                            {format(dataAtual, 'EEE', { locale: ptBR })}
                        </h3>
                        <p className="dia-data">
                             {format(dataAtual, 'dd/MM')}
                        </p>
                    </div>

                    <div className="slots-container">
                        {slotsDoDia.length > 0 ? (
                            slotsDoDia.map((horario, index) => {
                               const isSelecionado = slotSelecionado.date && isSameDay(slotSelecionado.date, dataAtual) && slotSelecionado.horario === horario;
                               return (
                                   <button
                                       key={index}
                                       className={`slot-btn ${isSelecionado ? 'slot-selecionado' : slotsDoDia.length > 0 ? 'slot-disponivel' : ''}`}
                                       onClick={() => setSlotSelecionado({ date: dataAtual, horario: horario })}
                                       disabled={carregando}
                                   >
                                       {horario}
                                   </button>
                               );
                            })
                        ) : (
                            <div className="sem-slot-container">
                                <p className="sem-slot">Sem horários</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return diasDaSemana;
    };

    return (
        <div className="componente-agenda">
            <h3 className="titulo-agenda">
                 {isOwner ? 'Configurar Agenda' : 'Disponibilidade e Agendamento'}
            </h3>

            {/* Navegação e Datas */}
            <div className="navegacao-semana">
                <button 
                    onClick={() => mudarSemana(-7)} 
                    disabled={carregando}
                    className="nav-btn"
                >{'<'}</button>
                <span className="periodo-span">
                    {format(semanaInicio, 'd MMM', { locale: ptBR })} - {format(addDays(semanaInicio, 6), 'd MMM yyyy', { locale: ptBR })}
                </span>
                <button 
                    onClick={() => mudarSemana(7)} 
                    disabled={carregando}
                    className="nav-btn"
                >{'>'}</button>
            </div>

            {/* Renderização dos Slots */}
            <div className="dias-agenda-container">
                {renderSlots()}
            </div>

            {/* Botão de Solicitação de Agendamento */}
            {!isOwner && (
                <div className="sumario-agendamento">
                    <button
                        className="btn-solicitar"
                        onClick={handleSolicitar}
                        // Verifica se o slot foi selecionado e se o usuário tem token para agendar
                        disabled={!slotSelecionado.date || carregando || !token} 
                    >
                        {carregando ? 'Enviando...' : 'Agendar uma Consulta'}
                    </button>
                    {erro && <p className="erro-solicitar">{erro}</p>}
                </div>
            )}
        </div>
    );
};

export default Agenda;