import jwt from 'jsonwebtoken';

export default function verificaToken(req, res, next){
    const token = req.header('Authorization')?.replace('Bearer', '');

    if(!token){
        return res.status(401).json({ msg: 'Acesso negado. Token não fornecido.' });
    }

    try{
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decodificado;
        next();
    } catch(err){
        return res.status(401).json({msg: 'Token Inválido!'})
    }
}