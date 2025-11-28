import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contextos/ContextoAutenticacao';
import { format, addDays, startOfWeek, isSameDay, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './Agenda.css';

interface SlotsDisponiveis {
    slotsPorDia: { [dia: string]: string[] };
    valorConsulta: number;
    duracao_Sessao: number;
    mensagem?: string;
}

interface DisponibilidadeProfissional {
    _id?: string;
    profissionalId: string;
    modalidade: 'Online' | 'Presencial' | 'Híbrido';
    dias: {
        diaSemana: string;
        horarios: { horaInicio: string; horaFim: string; }[];
    }[];
    excecoes?: {
        data: string;
        tipo: 'disponivel' | 'indisponivel';
        horarios?: { horaInicio: string; horaFim: string; }[];
        bloquearDiaInteiro?: boolean;
    }[];
}

interface AgendaProps {
    profissionalId: string;
    isOwner?: boolean;
}

const diasSemanaMap: { [key: number]: string } = {
    0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado'
};

const Agenda: React.FC<AgendaProps> = ({ profissionalId, isOwner = false }) => {
    const { token } = useAuth();
    const [semanaInicio, setSemanaInicio] = useState<Date>(
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );
    const [slotsData, setSlotsData] = useState<SlotsDisponiveis | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string>('');
    const [slotSelecionado, setSlotSelecionado] = useState<{ date: Date | null, horario: string | null }>({ date: null, horario: null });
    const [modalidade, setModalidade] = useState<'Online' | 'Presencial' | 'Híbrido'>('Online');

    const [disponibilidadeConfig, setDisponibilidadeConfig] = useState<DisponibilidadeProfissional | null>(null);
    const [editandoDia, setEditandoDia] = useState<string | null>(null);
    const [novoHorarioInicio, setNovoHorarioInicio] = useState<string>('09:00');
    const [novoHorarioFim, setNovoHorarioFim] = useState<string>('18:00');

    const buscarSlots = useCallback(async (dataInicio: Date) => {
        setCarregando(true);
        setErro('');
        const dataInicioString = format(dataInicio, 'yyyy-MM-dd');
        try {
            const url = `http://localhost:5000/api/agendamentos/slots/${profissionalId}?dataInicio=${dataInicioString}&modalidade=${modalidade}`;
            const res = await fetch(url);
            const data: SlotsDisponiveis = await res.json();
            if (!res.ok) {
                throw new Error(data.mensagem || "Falha ao carregar a agenda.");
            }
            setSlotsData(data);
        } catch (e: any) {
            console.error("Erro ao buscar slots:", e);
            setErro(e.message || "Erro de conexão ao buscar horários.");
            setSlotsData(null);
        } finally {
            setCarregando(false);
        }
    }, [profissionalId, modalidade]);

    const buscarDisponibilidadeProfissional = useCallback(async () => {
        if (!token || !isOwner) return;
        setCarregando(true);
        setErro('');
        try {
            const url = `http://localhost:5000/api/disponibilidade/${profissionalId}?modalidade=${modalidade}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data: DisponibilidadeProfissional[] = await res.json();
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.mensagem || "Falha ao carregar a configuração de disponibilidade.");
            }

            setDisponibilidadeConfig(data[0] || { profissionalId, modalidade, dias: [] });
        } catch (e: any) {
            console.error("Erro ao buscar disponibilidade do profissional:", e);
            setErro(e.message || "Erro de conexão ao buscar configuração de horários.");
            setDisponibilidadeConfig({ profissionalId, modalidade, dias: [] });
        } finally {
            setCarregando(false);
        }
    }, [profissionalId, token, isOwner, modalidade]);
    useEffect(() => {
        if (profissionalId) {
            if (isOwner) {
                buscarDisponibilidadeProfissional();
            } else {
                buscarSlots(semanaInicio);
            }
        }
    }, [semanaInicio, buscarSlots, buscarDisponibilidadeProfissional, profissionalId, isOwner]);

    const mudarSemana = (dias: number) => {
        setSemanaInicio(prev => addDays(prev, dias));
        setSlotSelecionado({ date: null, horario: null });
    };

    const handleSolicitar = async () => {
        if (!slotSelecionado.date || !slotSelecionado.horario || !token) {
            alert("Selecione um horário para agendar e faça login.");
            return;
        }
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
            buscarSlots(semanaInicio);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setCarregando(false);
        }
    };

    const handleAddHorario = () => {
        if (!editandoDia || !novoHorarioInicio || !novoHorarioFim) return;

        setDisponibilidadeConfig(prev => {
            if (!prev) return null;

            const diaExistente = prev.dias.find(d => d.diaSemana === editandoDia);
            if (diaExistente) {
                // Adiciona o novo horário e ordena
                diaExistente.horarios.push({ horaInicio: novoHorarioInicio, horaFim: novoHorarioFim });
                diaExistente.horarios.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
            } else {
                prev.dias.push({
                    diaSemana: editandoDia,
                    horarios: [{ horaInicio: novoHorarioInicio, horaFim: novoHorarioFim }]
                });
                prev.dias.sort((a, b) => {
                    const order = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
                    return order.indexOf(a.diaSemana) - order.indexOf(b.diaSemana);
                });
            }
            return { ...prev };
        });
        setNovoHorarioInicio('09:00');
        setNovoHorarioFim('18:00');
    };

    const handleRemoveHorario = (diaSemana: string, horaInicio: string, horaFim: string) => {
        setDisponibilidadeConfig(prev => {
            if (!prev) return null;
            const diaExistente = prev.dias.find(d => d.diaSemana === diaSemana);
            if (diaExistente) {
                diaExistente.horarios = diaExistente.horarios.filter(
                    h => !(h.horaInicio === horaInicio && h.horaFim === horaFim)
                );
                if (diaExistente.horarios.length === 0) {
                    prev.dias = prev.dias.filter(d => d.diaSemana !== diaSemana);
                }
            }
            return { ...prev };
        });
    };

    const handleSalvarDisponibilidade = async () => {
        if (!disponibilidadeConfig || !token) return;
        setCarregando(true);
        setErro('');
        try {
            const res = await fetch('http://localhost:5000/api/disponibilidade', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(disponibilidadeConfig),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.mensagem || "Falha ao salvar a disponibilidade.");
            }
            alert("Disponibilidade salva com sucesso!");
            buscarDisponibilidadeProfissional(); // Recarrega
        } catch (e: any) {
            console.error("Erro ao salvar disponibilidade:", e);
            setErro(e.message || "Erro de conexão ao salvar horários.");
        } finally {
            setCarregando(false);
        }
    };

    // 🚨 VERIFICAÇÃO DE SEGURANÇA (Adição Crucial)
    if (!profissionalId) {
        return <div className="erro-agenda">Erro: ID do Profissional não fornecido.</div>;
    }

    // Renderização de carregamento
    if (carregando && !slotsData && !disponibilidadeConfig) return <div className="loading-agenda">Carregando Agenda...</div>;

    // LÓGICA DE RENDERIZAÇÃO DOS SLOTS (para pacientes)
    const renderSlots = () => {
        const diasDaSemana = [];
        for (let i = 0; i < 7; i++) {
            const dataAtual = addDays(semanaInicio, i);
            const nomeDia = diasSemanaMap[getDay(dataAtual)]; // Usar getDay para o índice correto
            const slotsDoDia = slotsData?.slotsPorDia?.[nomeDia] || [];

            // Renderiza todos os dias da semana, não apenas úteis, para ser mais flexível
            // if (getDay(dataAtual) === 0 || getDay(dataAtual) === 6) continue; // Removido para mostrar todos os dias

            diasDaSemana.push(
                <div key={i} className="dia-coluna">
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
                                        className={`slot-btn ${isSelecionado ? 'slot-selecionado' : 'slot-disponivel'}`}
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

    const renderConfiguracaoDisponibilidade = () => {
        if (!disponibilidadeConfig) return <p>Carregando configuração de disponibilidade...</p>;

        const diasDaSemanaOrdem = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

        return (
            <div className="config-disponibilidade-container">
                <h4>Modalidade: {modalidade}</h4>
                <div className="modalidade-selector">
                    <button 
                        onClick={() => setModalidade('Online')} 
                        className={modalidade === 'Online' ? 'selected' : ''}
                    >Online</button>
                    <button 
                        onClick={() => setModalidade('Presencial')} 
                        className={modalidade === 'Presencial' ? 'selected' : ''}
                    >Presencial</button>
                    <button 
                        onClick={() => setModalidade('Híbrido')} 
                        className={modalidade === 'Híbrido' ? 'selected' : ''}
                    >Híbrido</button>
                </div>

                {diasDaSemanaOrdem.map(diaSemana => {
                    const dispDoDia = disponibilidadeConfig.dias.find(d => d.diaSemana === diaSemana);
                    return (
                        <div key={diaSemana} className="config-dia-item">
                            <h5>{diaSemana}</h5>
                            <div className="horarios-dia">
                                 {dispDoDia?.horarios && dispDoDia.horarios.length > 0 ? (
                                    dispDoDia.horarios.map((h, idx) => (
                                        <span key={idx} className="horario-tag">
                                            {h.horaInicio} - {h.horaFim}
                                            <button onClick={() => handleRemoveHorario(diaSemana, h.horaInicio, h.horaFim)} className="remove-horario-btn">x</button>
                                        </span>
                                    ))
                                ) : (
                                    <span className="sem-horario-config">Nenhum horário configurado</span>
                                )}
                            </div>
                            <div className="adicionar-horario-form">
                                <select value={editandoDia || ''} onChange={(e) => setEditandoDia(e.target.value)}>
                                    <option value="">Selecionar Dia</option>
                                    {diasDaSemanaOrdem.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <input type="time" value={novoHorarioInicio} onChange={(e) => setNovoHorarioInicio(e.target.value)} />
                                <input type="time" value={novoHorarioFim} onChange={(e) => setNovoHorarioFim(e.target.value)} />
                                <button onClick={handleAddHorario} disabled={!editandoDia || !novoHorarioInicio || !novoHorarioFim}>Adicionar Bloco</button>
                            </div>
                        </div>
                    );
                })}
                <button onClick={handleSalvarDisponibilidade} className="btn-salvar-config" disabled={carregando}>
                    {carregando ? 'Salvando...' : 'Salvar Configuração'}
                </button>
                {erro && <p className="erro-config">{erro}</p>}
            </div>
        );
    };


    return (
        <div className="componente-agenda">
            <h3 className="titulo-agenda">
                {isOwner ? 'Configurar Agenda' : 'Disponibilidade e Agendamento'}
            </h3>

            {/* Selector de Modalidade (visível para ambos, mas com lógica diferente) */}
            <div className="modalidade-selector">
                <button
                    onClick={() => setModalidade('Online')}
                    className={modalidade === 'Online' ? 'selected' : ''}
                    disabled={carregando}
                >Online</button>
                <button
                    onClick={() => setModalidade('Presencial')}
                    className={modalidade === 'Presencial' ? 'selected' : ''}
                    disabled={carregando}
                >Presencial</button>
                <button
                    onClick={() => setModalidade('Híbrido')}
                    className={modalidade === 'Híbrido' ? 'selected' : ''}
                    disabled={carregando}
                >Híbrido</button>
            </div>

            {isOwner ? (
                // Renderiza a interface de configuração para o profissional
                renderConfiguracaoDisponibilidade()
            ) : (
                // Renderiza a interface de agendamento para o paciente
                <>
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
                    <div className="sumario-agendamento">
                        <button
                            className="btn-solicitar"
                            onClick={handleSolicitar}
                            disabled={!slotSelecionado.date || carregando || !token}
                        >
                            {carregando ? 'Enviando...' : 'Agendar uma Consulta'}
                        </button>
                        {erro && <p className="erro-solicitar">{erro}</p>}
                    </div>
                </>
            )}
        </div>
    );
};

export default Agenda;
