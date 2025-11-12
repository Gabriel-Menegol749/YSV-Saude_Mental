import jwt from 'jsonwebtoken';

export default function verificaToken(req, res, next){
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer') ? authHeader.substring(7) : authHeader;

    if(!token){
        return res.status(401).json({ msg: 'Acesso negado. Token não fornecido.' });
    }

    try{
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decodificado;
        next();
    } catch(err){
        console.log("Erro na validação de token: ", err.message);
        return res.status(401).json({msg: 'Token Inválido!'})
    }
}