import express from "express";
import jwt from "jsonwebtoken";
import verificaToken from "../middlewares/verificaToken.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Converta para Number, pois variáveis de ambiente são strings
const appID = Number(process.env.ZEGO_APP_ID);
const serverSecret = process.env.ZEGO_SERVER_SECRET;

// Tempo de expiração do token Zego (em segundos) — 1 hora
const EXPIRE_TIME = 3600;

/*
    POST /api/zego/token
    Body:
    {
        "roomID": "id_da_consulta"
    }
*/
router.post("/token", verificaToken, (req, res) => {
    try {
        const { roomID } = req.body;

        if (!roomID) {
            return res.status(400).json({ erro: "roomID é obrigatório" });
        }

        const userID = req.usuario?._id || req.usuario?.id;

        if (!userID) {
            return res.status(401).json({ erro: "Usuário não identificado. Token inválido ou ausente." });
        }

        const payload = {
            app_id: appID,
            user_id: userID.toString(),
            room_id: roomID,
            privilege: {
                1: 1,
                2: 1,
            },
            expire: Math.floor(Date.now() / 1000) + EXPIRE_TIME,
        };

        const token = jwt.sign(payload, serverSecret, { algorithm: "HS256" });

        return res.json({
            token,
            userID,
            roomID,
        });

    } catch (erro) {
        console.error("Erro ao gerar token Zego:", erro);
        return res.status(500).json({ erro: "Erro ao gerar token Zego" });
    }
});

export default router;
