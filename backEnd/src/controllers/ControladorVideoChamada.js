// src/controllers/ControladorVideoChamada.js
import dotenv from 'dotenv';
import crypto from 'crypto'; // Módulo nativo do Node.js para criptografia

dotenv.config();

// Suas credenciais ZegoCloud
// Certifique-se de que ZEGOCLOUD_APP_ID e ZEGOCLOUD_SERVER_SECRET estão no seu arquivo .env
const APP_ID = parseInt(process.env.ZEGOCLOUD_APP_ID || '0');
const SERVER_SECRET = process.env.ZEGOCLOUD_SERVER_SECRET || '';

// Função para gerar o token ZegoCloud (baseada na documentação oficial)
// Esta função é uma implementação direta da lógica de geração de token JWT da ZegoCloud.
function generateZegoToken(appID, serverSecret, userID, expireTime, roomID) {
    if (!appID || !serverSecret || !userID || !expireTime) {
        console.error("Missing parameters for Zego token generation.");
        return '';
    }

    const payload = {
        app_id: appID,
        user_id: userID,
        nonce: crypto.randomBytes(16).toString('hex'), // Um valor aleatório para cada token
        ctime: Math.floor(Date.now() / 1000), // Tempo de criação (segundos desde a época)
        expire: expireTime, // Tempo de expiração (segundos)
        room_id: roomID // ID da sala
    };

    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    // Codifica o cabeçalho e o payload em Base64 URL-safe
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    // Cria a assinatura HMAC SHA256
    const signature = crypto.createHmac('sha256', serverSecret)
                            .update(`${encodedHeader}.${encodedPayload}`)
                            .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export const gerarTokenZegoCloud = async (req, res) => {
    try {
        // userId é o ID do usuário logado, roomId é o ID da consulta
        const { userId, roomId } = req.body; 

        if (!userId || !roomId) {
            return res.status(400).json({ mensagem: 'userId e roomId são obrigatórios.' });
        }

        // Tempo de expiração do token (em segundos). Ex: 24 horas
        const expireTime = 60 * 60 * 24; 

        // Gera o token usando a função local
        const token = generateZegoToken(APP_ID, SERVER_SECRET, userId, expireTime, roomId);

        if (!token) {
            return res.status(500).json({ mensagem: 'Falha ao gerar o token ZegoCloud.' });
        }

        res.status(200).json({ token });

    } catch (error) {
        console.error("Erro ao gerar token ZegoCloud:", error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao gerar token ZegoCloud.' });
    }
};
