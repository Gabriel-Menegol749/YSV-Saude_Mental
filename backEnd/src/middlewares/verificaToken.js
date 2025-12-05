// src/middlewares/verificaToken.js
import jwt from 'jsonwebtoken';
// Adicione o log do dotenv para garantir que o JWT_SECRET está sendo carregado
import dotenv from 'dotenv';
dotenv.config();

const verificaToken = (req, res, next) => {
    console.log(`[DEBUG_VERIFICA_TOKEN_START] ${new Date().toISOString()} - Acionado para ${req.method} ${req.originalUrl}`);
    console.log(`[DEBUG_VERIFICA_TOKEN] JWT_SECRET está definido? ${!!process.env.JWT_SECRET}`); // Verifica se a variável de ambiente está carregada

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        console.log('[DEBUG_VERIFICA_TOKEN_FAIL] Token não fornecido no cabeçalho Authorization.');
        return res.status(401).json({ mensagem: 'Token não fornecido.' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log('[DEBUG_VERIFICA_TOKEN_FAIL] Formato de token inválido (Bearer <token> esperado).');
        return res.status(401).json({ mensagem: 'Formato de token inválido.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[DEBUG_VERIFICA_TOKEN] Conteúdo do token decodificado:', decoded);

        // Padroniza o ID do usuário para '_id'
        const userId = decoded.id || decoded._id; // Tenta 'id' primeiro, depois '_id'
        if (!userId) {
            console.error('[DEBUG_VERIFICA_TOKEN_FAIL] ID do usuário não encontrado no token decodificado.');
            return res.status(401).json({ mensagem: 'ID do usuário ausente no token.' });
        }

        // Anexa o objeto do usuário ao req.usuario, garantindo que a propriedade _id exista
        req.usuario = { ...decoded, _id: userId };
        console.log(`[DEBUG_VERIFICA_TOKEN_SUCCESS] Token verificado com sucesso para usuário ID: ${req.usuario._id}`);
        next();
    } catch (error) {
        console.error(`[DEBUG_VERIFICA_TOKEN_ERROR] Erro ao verificar token: ${error.message}`);
        return res.status(401).json({ mensagem: 'Token inválido.' });
    }
};
export default verificaToken;
