// src/controllers/ControladorMensagens.js

import Conversa from '../models/Conversa.js';
import Mensagem from '../models/Mensagem.js'; // Certifique-se de que o caminho está correto
import Usuario from '../models/Usuarios.js'; // Certifique-se de que o caminho está correto
import mongoose from 'mongoose';

// Função auxiliar para encontrar o outro participante em uma conversa
// Esta função é robusta e verifica se o participante existe e está populado
const getOutroParticipante = (conversa, usuarioId) => {
    if (!conversa.participantes || !Array.isArray(conversa.participantes)) {
        return null;
    }
    // O populate já deve ter trazido os objetos completos dos participantes
    const outro = conversa.participantes.find(
        (p) => p && p._id && p._id.toString() !== usuarioId.toString()
    );
    return outro || null; // Retorna o participante ou null se não encontrar
};

// Função auxiliar para formatar a data para o formato dd-MM-yyyy
const formatarDataParaDDMMYYYY = (date) => {
    if (!date) return null;
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            return null;
        }
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0'); // Mês é 0-indexado
        const ano = d.getFullYear();
        return `${dia}-${mes}-${ano}`;
    } catch (e) {
        console.error("Erro ao formatar data:", e);
        return null;
    }
};

// Função auxiliar para formatar a conversa para o frontend
const formatarConversaParaFrontend = async (conversa, usuarioId) => {
    const outroParticipante = getOutroParticipante(conversa, usuarioId);

    console.log(`[BACKEND_CHAT_CONTROLLER] formatarConversaParaFrontend - outroParticipante para conversa ${conversa._id}:`, outroParticipante);

    const naoLidasContadorMap = conversa.naoLidasContador instanceof Map
        ? conversa.naoLidasContador
        : new Map(Object.entries(conversa.naoLidasContador || {}));

    const contadorParaUsuario = naoLidasContadorMap.get(usuarioId.toString()) || 0;

    // Formata a última mensagem de forma mais robusta
    const ultimaMensagemFormatada = conversa.ultimaMensagem?.conteudo ? {
        conteudo: conversa.ultimaMensagem.conteudo,
        timestamp: conversa.ultimaMensagem.timestamp, // Mantém o Date para o frontend formatar
        remetente: conversa.ultimaMensagem.remetente?._id?.toString() || '',
        remetenteNome: conversa.ultimaMensagem.remetente?.nome || 'Desconhecido',
        remetenteFoto: conversa.ultimaMensagem.remetente?.fotoPerfil || '/uploads/fotosPerfil/default.png', // Imagem padrão
    } : undefined;

    return {
        _id: conversa._id.toString(), // Garante que o ID é uma string
        participanteId: outroParticipante?._id?.toString() || '',
        nomeParticipante: outroParticipante?.nome || 'Usuário Desconhecido',
        fotoParticipante: outroParticipante?.fotoPerfil || '/uploads/fotosPerfil/default.png', // Imagem padrão
        ultimaMensagem: ultimaMensagemFormatada,
        timestampUltimaMensagem: conversa.updatedAt, // Usar updatedAt da conversa para ordenação
        naoLidasContador: contadorParaUsuario,
    };
};

// @route   GET /api/chat/conversas
// @desc    Obter todas as conversas do usuário logado
// @access  Privado
export const getConversasDoUsuario = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        console.log(`[BACKEND_CHAT_CONTROLLER] getConversasDoUsuario acionado para usuário ID: ${usuarioId}`);

        const conversas = await Conversa.find({
            participantes: usuarioId,
        })
        .populate('participantes', 'nome fotoPerfil') // Popula os participantes com nome e fotoPerfil
        .populate({
            path: 'ultimaMensagem.remetente', // Popula o remetente dentro do subdocumento ultimaMensagem
            select: 'nome fotoPerfil'
        })
        .sort({ 'updatedAt': -1 }); // Ordena pelas conversas mais recentes

        console.log(`[BACKEND_CHAT_CONTROLLER] Conversas encontradas para ${usuarioId}: ${conversas.length}`);

        // Mapeia e formata cada conversa, aguardando a Promise de formatarConversaParaFrontend
        const conversasFormatadas = await Promise.all(
            conversas.map(conversa => formatarConversaParaFrontend(conversa, usuarioId))
        );

        res.status(200).json(conversasFormatadas);
    } catch (error) {
        console.error('Erro ao obter conversas do usuário:', error);
        res.status(500).json({ mensagem: 'Erro no servidor ao obter conversas.' });
    }
};

export const iniciarOuObterConversa = async (req, res) => {
    try {
        const usuarioId = req.usuario._id; // ID do usuário logado
        const { destinatarioId } = req.body; // ID do usuário com quem iniciar a conversa

        if (!destinatarioId) {
            return res.status(400).json({ mensagem: 'ID do destinatário é obrigatório.' });
        }

        // Garante que os IDs dos participantes estejam ordenados para a busca e criação
        const participantesOrdenados = [
            new mongoose.Types.ObjectId(usuarioId),
            new mongoose.Types.ObjectId(destinatarioId)
        ].sort((a, b) => a.toString().localeCompare(b.toString()));

        // Tenta encontrar uma conversa existente com esses dois participantes
        let conversa = await Conversa.findOne({
            participantes: { $all: participantesOrdenados } // Busca por todos os IDs no array
        })
        .populate('participantes', 'nome fotoPerfil') // Popula dados dos participantes
        .populate({
            path: 'ultimaMensagem.remetente',
            select: 'nome fotoPerfil'
        });

        if (!conversa) {
            // Se não existir, cria uma nova conversa
            conversa = new Conversa({
                participantes: participantesOrdenados,
                naoLidasContador: new Map(), // Inicializa o contador de não lidas
            });
            await conversa.save(); // O hook pre('save') vai garantir a ordenação final e o updatedAt

            // Popula a nova conversa para que formatarConversaParaFrontend funcione
            conversa = await conversa.populate('participantes', 'nome fotoPerfil');
        }

        // Formata a conversa para o frontend
        const conversaFormatada = await formatarConversaParaFrontend(conversa, usuarioId);
        return res.status(200).json(conversaFormatada);

    } catch (error) {
        console.error('Erro ao iniciar ou obter conversa:', error);
        return res.status(500).json({ mensagem: 'Erro interno do servidor ao iniciar ou obter conversa.' });
    }
};

export const getMensagensDaConversa = async (req, res) => {
    try {
        const { conversaId } = req.params;
        const usuarioId = req.usuario._id;

        // Verifica se a conversa existe e se o usuário logado é participante
        const conversa = await Conversa.findById(conversaId);
        if (!conversa || !conversa.participantes.some(p => p.toString() === usuarioId.toString())) {
            return res.status(403).json({ mensagem: 'Acesso negado à conversa ou conversa não encontrada.' });
        }

        const mensagens = await Mensagem.find({ conversaId })
            .populate('remetente', 'nome fotoPerfil') // Popula o remetente da mensagem
            .sort('timestamp'); // Ordena as mensagens por timestamp

        res.status(200).json(mensagens);
    } catch (error) {
        console.error('Erro ao obter mensagens da conversa:', error);
        res.status(500).json({ mensagem: 'Erro no servidor ao obter mensagens.' });
    }
};

// @route   POST /api/chat/mensagens
// @desc    Enviar uma nova mensagem
// @access  Privado
export const enviarMensagem = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { conversaId, conteudo } = req.body;
        console.log(`[BACKEND_CHAT_CONTROLLER] enviarMensagem acionado. Conversa: ${conversaId}, Remetente: ${usuarioId}, Conteúdo: ${conteudo}`);

        if (!conversaId || !conteudo) {
            return res.status(400).json({ mensagem: 'ID da conversa e conteúdo da mensagem são obrigatórios.' });
        }

        const conversa = await Conversa.findById(conversaId);
        if (!conversa || !conversa.participantes.some(p => p.toString() === usuarioId.toString())) {
            return res.status(403).json({ mensagem: 'Acesso negado à conversa ou conversa não encontrada.' });
        }

        const novaMensagem = new Mensagem({
            conversaId,
            remetente: usuarioId,
            conteudo,
        });
        await novaMensagem.save();

        // Atualizar a última mensagem da conversa como um subdocumento
        conversa.ultimaMensagem = {
            conteudo: novaMensagem.conteudo,
            timestamp: novaMensagem.timestamp,
            remetente: novaMensagem.remetente, // Aqui é o ObjectId do remetente
        };

        // Incrementar contador de mensagens não lidas para o outro participante
        const outroParticipanteId = conversa.participantes.find(
            (p) => p.toString() !== usuarioId.toString()
        );

        if (outroParticipanteId) {
            // Garante que naoLidasContador é um Map antes de tentar manipulá-lo
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
        if (!conversa || !conversa.participantes.some(p => p.toString() === usuarioId.toString())) {
            return res.status(403).json({ mensagem: 'Acesso negado à conversa.' });
        }

        // Garante que naoLidasContador é um Map antes de tentar manipulá-lo
        if (conversa.naoLidasContador instanceof Map) {
            conversa.naoLidasContador.set(usuarioId.toString(), 0);
        } else {
            // Se não for um Map, converte para Map, atualiza e depois converte de volta se necessário
            const tempMap = new Map(Object.entries(conversa.naoLidasContador || {}));
            tempMap.set(usuarioId.toString(), 0);
            conversa.naoLidasContador = tempMap; // Mongoose deve lidar com a conversão para Map
        }
        await conversa.save();
        res.status(200).json({ mensagem: 'Mensagens marcadas como lidas.' });
    } catch (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
        res.status(500).json({ mensagem: 'Erro no servidor ao marcar mensagens como lidas.' });
    }
};
