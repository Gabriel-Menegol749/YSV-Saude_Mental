import jwt from 'jsonwebtoken'

export const protegeRotas = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token){
        return res.status(401).json({ msg: 'Acesso negado, token ausente' });
    }
    try{
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodificado;
        next();
    } catch(err){
        res.status(401).json({ msg: 'Token inválido.' });
    }
};