// src/controllers/ControladorMensagens.js

import Conversa from '../models/Conversa.js';
import Mensagem from '../models/Mensagem.js';
import Usuario from '../models/Usuarios.js';

// Função auxiliar para encontrar o outro participante em uma conversa
const getOutroParticipante = (conversa, usuarioId) => {
    if (!conversa.participantes || !Array.isArray(conversa.participantes)) {
        return null;
    }
    return conversa.participantes.find(
        (p) => p && p._id && p._id.toString() !== usuarioId.toString()
    );
};

// Função auxiliar para formatar a data para o formato dd-MM-yyyy
const formatarDataParaDDMMYYYY = (date) => {
  if (!date) return null; // Retorna null se a data for undefined ou null
  try {
    const d = new Date(date);
    // Verifica se a data é válida antes de formatar
    if (isNaN(d.getTime())) {
      return null; // Retorna null se a data for inválida
    }
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0'); // Mês é 0-indexado
    const ano = d.getFullYear();
    return `${dia}-${mes}-${ano}`;
  } catch (e) {
    console.error("Erro ao formatar data:", e);
    return null; // Em caso de erro na formatação
  }
};

// Função auxiliar para formatar a conversa para o frontend
const formatarConversaParaFrontend = (conversa, usuarioId) => {
    const outroParticipante = getOutroParticipante(conversa, usuarioId);

    // Garante que naoLidasContador é um objeto simples
    const naoLidasContadorObj = conversa.naoLidasContador instanceof Map
        ? Object.fromEntries(conversa.naoLidasContador)
        : conversa.naoLidasContador || {};
    const contadorParaUsuario = naoLidasContadorObj[usuarioId.toString()] || 0;

    // Acessa e formata a última mensagem com segurança
    const ultimaMensagemConteudo = conversa.ultimaMensagem?.conteudo || null;
    const ultimaMensagemTimestamp = conversa.ultimaMensagem?.timestamp
        ? formatarDataParaDDMMYYYY(conversa.ultimaMensagem.timestamp)
        : null;
    const ultimaMensagemRemetente = conversa.ultimaMensagem?.remetente?.toString() || null;
    const ultimaMensagemRemetenteNome = conversa.ultimaMensagem?.remetente?.nome || null;
    const ultimaMensagemRemetenteFoto = conversa.ultimaMensagem?.remetente?.fotoPerfil || null;


    return {
        _id: conversa._id,
        participanteId: outroParticipante?._id.toString(),
        nomeParticipante: outroParticipante?.nome || 'Usuário Desconhecido',
        fotoParticipante: outroParticipante?.fotoPerfil || '/uploads/default-profile.png', // Usar imagem padrão
        ultimaMensagem: conversa.ultimaMensagem ? {
            conteudo: ultimaMensagemConteudo,
            timestamp: ultimaMensagemTimestamp,
            remetente: ultimaMensagemRemetente,
            remetenteNome: ultimaMensagemRemetenteNome,
            remetenteFoto: ultimaMensagemRemetenteFoto,
        } : undefined, // Se não houver ultimaMensagem, o objeto é undefined
        timestampUltimaMensagem: ultimaMensagemTimestamp, // Já formatado
        naoLidasContador: contadorParaUsuario, // Agora é um número simples
    };
};

// @route   GET /api/chat/conversas
// @desc    Obter todas as conversas de um usuário
// @access  Privado
export const getConversasDoUsuario = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        console.log(`[BACKEND_CHAT_CONTROLLER] getConversasDoUsuario acionado para usuário ID: ${usuarioId}`);

        const conversas = await Conversa.find({
            participantes: usuarioId,
        })
        .populate('participantes', 'nome fotoPerfil')
        .populate({
            path: 'ultimaMensagem',
            select: 'conteudo timestamp remetente', // Seleciona os campos necessários da ultimaMensagem
            populate: {
                path: 'remetente',
                select: 'nome fotoPerfil' // Popula o remetente da ultimaMensagem com nome e fotoPerfil
            }
        })
        .sort({ 'ultimaMensagem.timestamp': -1 }); // Ordena pelas mais recentes

        console.log(`[BACKEND_CHAT_CONTROLLER] Retornando ${conversas.length} conversas para usuário ID: ${usuarioId}`);

        const conversasFormatadas = conversas.map(conversa => {
            console.log(`[BACKEND_CHAT_CONTROLLER] Processando conversa ID: ${conversa._id}, Participantes: ${JSON.stringify(conversa.participantes)}`);
            return formatarConversaParaFrontend(conversa, usuarioId);
        });

        res.status(200).json(conversasFormatadas);
    } catch (error) {
        console.error('Erro ao buscar conversas do usuário:', error);
        res.status(500).json({ mensagem: 'Erro no servidor ao buscar conversas.' });
    }
};

// @route   GET /api/chat/mensagens/:conversaId
// @desc    Obter mensagens de uma conversa específica
// @access  Privado
export const getMensagensDaConversa = async (req, res) => {
    try {
        const { conversaId } = req.params;
        const usuarioId = req.usuario._id;
        console.log(`[BACKEND_CHAT_CONTROLLER] getMensagensDaConversa acionado para conversa ID: ${conversaId} pelo usuário: ${usuarioId}`);

        const conversa = await Conversa.findById(conversaId);
        if (!conversa || !conversa.participantes.includes(usuarioId)) {
            return res.status(403).json({ mensagem: 'Acesso negado à conversa.' });
        }

        const mensagens = await Mensagem.find({ conversaId })
            .populate('remetente', 'nome fotoPerfil')
            .sort('timestamp');

        console.log(`[BACKEND_CHAT_CONTROLLER] Retornando ${mensagens.length} mensagens para conversa ID: ${conversaId}`);
        res.status(200).json(mensagens);
    } catch (error) {
        console.error('Erro ao buscar mensagens da conversa:', error);
        res.status(500).json({ mensagem: 'Erro no servidor ao buscar mensagens.' });
    }
};

// @route   POST /api/chat/iniciar
// @desc    Inicia ou obtém uma conversa com um destinatário
// @access  Privado
export const iniciarOuObterConversa = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { destinatarioId } = req.body; // Destinatário vem do corpo da requisição
        console.log(`[BACKEND_CHAT_CONTROLLER] iniciarOuObterConversa acionado. Usuário: ${usuarioId}, Destinatário: ${destinatarioId}`);

        if (!destinatarioId) {
            return res.status(400).json({ mensagem: 'ID do destinatário é obrigatório.' });
        }

        // Evitar iniciar conversa consigo mesmo
        if (usuarioId.toString() === destinatarioId.toString()) {
            return res.status(400).json({ mensagem: 'Não é possível iniciar uma conversa consigo mesmo.' });
        }

        let conversa = await Conversa.findOne({
            participantes: { $all: [usuarioId, destinatarioId] },
        })
        .populate('participantes', 'nome fotoPerfil')
        .populate({
            path: 'ultimaMensagem',
            select: 'conteudo timestamp remetente',
            populate: {
                path: 'remetente',
                select: 'nome fotoPerfil'
            }
        });

        if (!conversa) {
            console.log(`[BACKEND_CHAT_CONTROLLER] Nenhuma conversa existente encontrada. Criando nova conversa entre ${usuarioId} e ${destinatarioId}`);
            conversa = new Conversa({
                participantes: [usuarioId, destinatarioId],
                naoLidasContador: {
                    [usuarioId.toString()]: 0,
                    [destinatarioId.toString()]: 0,
                },
            });
            await conversa.save();

            // Popula novamente após salvar para ter os dados completos
            conversa = await Conversa.findById(conversa._id)
                .populate('participantes', 'nome fotoPerfil')
                .populate({
                    path: 'ultimaMensagem',
                    select: 'conteudo timestamp remetente',
                    populate: {
                        path: 'remetente',
                        select: 'nome fotoPerfil'
                    }
                });
            console.log(`[BACKEND_CHAT_CONTROLLER] Nova conversa criada: ${conversa._id}`);
        } else {
            console.log(`[BACKEND_CHAT_CONTROLLER] Conversa existente encontrada: ${conversa._id}`);
        }

        const conversaFormatada = formatarConversaParaFrontend(conversa, usuarioId);
        res.status(200).json(conversaFormatada);
    } catch (error) {
        console.error('Erro ao iniciar ou obter conversa:', error);
        // Verifica se o erro é de chave duplicada (MongoDB E11000)
        if (error.code === 11000) {
            console.error('Erro de chave duplicada ao criar conversa:', error.keyValue);
            return res.status(409).json({ mensagem: 'Uma conversa com esses participantes já existe.' });
        }
        res.status(500).json({ mensagem: 'Erro no servidor ao iniciar ou obter conversa.' });
    }
};

// @route   POST /api/chat/mensagens
// @desc    Enviar uma nova mensagem
// @access  Privado
export const enviarMensagem = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { conversaId, conteudo } = req.body; // <-- Here, it expects conversaId and conteudo
        console.log(`[BACKEND_CHAT_CONTROLLER] enviarMensagem acionado. Conversa: ${conversaId}, Remetente: ${usuarioId}, Conteúdo: ${conteudo}`);

        if (!conversaId || !conteudo) {
            return res.status(400).json({ mensagem: 'ID da conversa e conteúdo da mensagem são obrigatórios.' });
        }

        const conversa = await Conversa.findById(conversaId);
        if (!conversa || !conversa.participantes.includes(usuarioId)) {
            return res.status(403).json({ mensagem: 'Acesso negado à conversa ou conversa não encontrada.' });
        }

        const novaMensagem = new Mensagem({
            conversaId,
            remetente: usuarioId,
            conteudo,
        });
        await novaMensagem.save();

        // Atualizar a última mensagem da conversa
        conversa.ultimaMensagem = {
            conteudo: novaMensagem.conteudo,
            timestamp: novaMensagem.timestamp,
            remetente: novaMensagem.remetente,
        };

        // Incrementar contador de mensagens não lidas para o outro participante
        const outroParticipanteId = conversa.participantes.find(
            (p) => p.toString() !== usuarioId.toString()
        );

        if (outroParticipanteId) {
            // Garante que naoLidasContador é um Map antes de usar .set
            if (!(conversa.naoLidasContador instanceof Map)) {
                conversa.naoLidasContador = new Map(Object.entries(conversa.naoLidasContador || {}));
            }
            const currentCount = conversa.naoLidasContador.get(outroParticipanteId.toString()) || 0;
            conversa.naoLidasContador.set(outroParticipanteId.toString(), currentCount + 1);
        }
        await conversa.save();

        // Popula o remetente da mensagem para retornar ao frontend
        const mensagemCompleta = await novaMensagem.populate('remetente', 'nome fotoPerfil');
        console.log(`[BACKEND_CHAT_CONTROLLER] Mensagem enviada e conversa atualizada: ${novaMensagem._id}`);
        res.status(201).json(mensagemCompleta);
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ mensagem: 'Erro no servidor ao enviar mensagem.' });
    }
};

// @route   PUT /api/chat/mensagens/:conversaId/lida
// @desc    Marcar mensagens de uma conversa como lidas
// @access  Privado
export const marcarMensagensComoLidas = async (req, res) => {
    try {
        const { conversaId } = req.params;
        const usuarioId = req.usuario._id;
        console.log(`[BACKEND_CHAT_CONTROLLER] marcarMensagensComoLidas acionado para conversa ID: ${conversaId} pelo usuário: ${usuarioId}`);

        const conversa = await Conversa.findById(conversaId);
        if (!conversa || !conversa.participantes.includes(usuarioId)) {
            return res.status(403).json({ mensagem: 'Acesso negado à conversa.' });
        }

        // Resetar o contador de não lidas para o usuário atual
        if (conversa.naoLidasContador instanceof Map) {
            conversa.naoLidasContador.set(usuarioId.toString(), 0);
        } else {
            // Se não for um Map, converte para Map, atualiza e depois converte de volta se necessário
            const tempMap = new Map(Object.entries(conversa.naoLidasContador || {}));
            tempMap.set(usuarioId.toString(), 0);
            conversa.naoLidasContador = Object.fromEntries(tempMap); // Converte de volta para objeto
        }
        await conversa.save();

        res.status(200).json({ mensagem: 'Mensagens marcadas como lidas.' });
    } catch (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
        res.status(500).json({ mensagem: 'Erro no servidor ao marcar mensagens como lidas.' });
    }
};
