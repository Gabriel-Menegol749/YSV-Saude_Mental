import { useNotificacoes } from '../contextos/ContextoNotificacoes';
import type { Notificacao } from '../contextos/ContextoNotificacoes';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { forwardRef, useEffect } from 'react';
import './Notificacoes.css';
import botaoX from '../assets/x-pra sair.svg';

interface NotificacoesProps {
  onClose: () => void;
}

const Notificacoes = forwardRef<HTMLDivElement, NotificacoesProps>(({ onClose }, ref) => {
  const { notificacoes, limparNotificacoes, marcarTodasComoLidas } = useNotificacoes();

  // Funções auxiliares para extrair dados com segurança
  const getNome = (dados: any, tipoUsuario: 'cliente' | 'profissional' | 'outro') => {
    if (!dados) return 'Desconhecido';
    switch (tipoUsuario) {
      case 'cliente':
        return dados.clienteNome ?? 'Desconhecido';
      case 'profissional':
        return dados.profissionalNome ?? 'Desconhecido';
      case 'outro': // Usado para o outro lado da interação (ex: profissional para cliente, ou vice-versa)
        return dados.outroUsuarioNome ?? 'Desconhecido';
      default:
        return 'Desconhecido';
    }
  };

  const getDataFormatada = (dados: any, tipoData: 'original' | 'nova') => {
    if (!dados) return 'data desconhecida';
    const dataString = tipoData === 'original' ? dados.data : dados.novaData;
    // O backend já envia a data formatada como 'dd/MM/yyyy', então podemos usar diretamente.
    return dataString ?? 'data desconhecida';
  };

  const getHorario = (dados: any, tipoHorario: 'original' | 'novo') => {
    if (!dados) return 'horário desconhecido';
    const horarioString = tipoHorario === 'original' ? dados.horario : dados.novoHorario;
    return horarioString ?? 'horário desconhecido';
  };

  const formatarMensagemNotificacao = (notificacao: Notificacao) => {
    const { tipo, dados } = notificacao;

    if (!dados) {
      console.warn('Notificação recebida sem dados:', notificacao);
      return `Notificação do tipo "${tipo}" recebida sem detalhes.`;
    }

    switch (tipo) {
      case 'agendamento_solicitado':
        return `Você recebeu uma nova solicitação de agendamento do cliente ${getNome(dados, 'cliente')} para ${getDataFormatada(dados, 'original')} às ${getHorario(dados, 'original')}.`;

      case 'agendamento_confirmado':
        return `Seu agendamento com ${getNome(dados, 'profissional')} para ${getDataFormatada(dados, 'original')} às ${getHorario(dados, 'original')} foi confirmado!`;

      case 'agendamento_recusado':
        return `Seu agendamento com ${getNome(dados, 'profissional')} para ${getDataFormatada(dados, 'original')} às ${getHorario(dados, 'original')} foi recusado.`;

      case 'agendamento_cancelado':
        return `O agendamento com ${getNome(dados, 'outro')} para ${getDataFormatada(dados, 'original')} às ${getHorario(dados, 'original')} foi cancelado.`;

      case 'reagendamento_proposto_profissional':
        return `O profissional ${getNome(dados, 'profissional')} propôs um novo horário: ${getDataFormatada(dados, 'nova')} às ${getHorario(dados, 'novo')}.`;

      case 'reagendamento_proposto_cliente':
        return `O cliente ${getNome(dados, 'cliente')} propôs um novo horário: ${getDataFormatada(dados, 'nova')} às ${getHorario(dados, 'novo')}.`;

      case 'reagendamento_aceito_cliente':
        return `O cliente ${getNome(dados, 'cliente')} aceitou sua proposta de reagendamento para ${getDataFormatada(dados, 'original')} às ${getHorario(dados, 'original')}.`;

      case 'reagendamento_recusado_cliente':
        return `O cliente ${getNome(dados, 'cliente')} recusou sua proposta de reagendamento para ${getDataFormatada(dados, 'original')} às ${getHorario(dados, 'original')}.`;

      case 'reagendamento_aceito_profissional':
        return `O profissional ${getNome(dados, 'profissional')} aceitou sua proposta de reagendamento para ${getDataFormatada(dados, 'original')} às ${getHorario(dados, 'original')}.`;

      case 'reagendamento_recusado_profissional':
        return `O profissional ${getNome(dados, 'profissional')} recusou sua proposta de reagendamento para ${getDataFormatada(dados, 'original')} às ${getHorario(dados, 'original')}.`;

      case 'pagamento_realizado':
        return `O cliente ${getNome(dados, 'cliente')} realizou o pagamento do agendamento de ${getDataFormatada(dados, 'original')} às ${getHorario(dados, 'original')}.`;

      case 'agendamento_finalizado': // Corrigido para bater com o backend
        return `Sua consulta com ${getNome(dados, 'profissional')} em ${getDataFormatada(dados, 'original')} às ${getHorario(dados, 'original')} foi finalizada.`;

      case 'feedback_adicionado':
        return `Você recebeu um feedback do cliente ${getNome(dados, 'cliente')} para a consulta de ${getDataFormatada(dados, 'original')} às ${getHorario(dados, 'original')}. Nota: ${dados.nota ?? 'N/A'}.`;

      default:
        return `Nova notificação: ${tipo}.`;
    }
  };

  useEffect(() => {
    marcarTodasComoLidas();
  }, [marcarTodasComoLidas]);

  try {
    return (
      <div className="NotificacoesContainer" ref={ref}>
        <div className="notificacoesCabecalho">
          <h2>Notificações</h2>
          <button className="botaoFecharMenu" onClick={onClose}>
            <img src={botaoX} alt="Fechar" className="BotaoFecharNotificacoes" />
          </button>
        </div>
        {notificacoes.length === 0 ? (
          <p className="NenhumaNotificacao">Nenhuma notificação no momento.</p>
        ) : (
          <>
            <ul className="NotificacoesLista">
              {notificacoes.map((notificacao, index) => {
                let dataHoraFormatada = 'Data/Hora desconhecida';
                if (notificacao.timestamp) {
                  const parsedDate = parseISO(notificacao.timestamp);
                  if (isValid(parsedDate)) {
                    dataHoraFormatada = format(parsedDate, 'dd/MM/yyyy HH:mm', { locale: ptBR });
                  } else {
                    console.warn('Timestamp inválido para parseISO:', notificacao.timestamp);
                  }
                }

                return (
                  <li key={index} className="NotificacaoItem">
                    <p>{formatarMensagemNotificacao(notificacao)}</p>
                    <small>{dataHoraFormatada}</small>
                  </li>
                );
              })}
            </ul>
            <button onClick={limparNotificacoes} className="BotaoLimparNotificacoes">
              Limpar Notificações
            </button>
          </>
        )}
      </div>
    );
  } catch (error) {
    console.error("Erro ao renderizar Notificações:", error);
    return (
      <div className="NotificacoesContainer" ref={ref}>
        <div className="notificacoesCabecalho">
          <h2>Notificações</h2>
          <button className="botaoFecharMenu" onClick={onClose}>
            <img src={botaoX} alt="Fechar" className="BotaoFecharNotificacoes" />
          </button>
        </div>
        <p className="NenhumaNotificacao">Ocorreu um erro ao carregar as notificações. Por favor, tente novamente.</p>
      </div>
    );
  }
});

export default Notificacoes;
