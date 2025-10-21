import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    participantes: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }
    ],
    mensagens: [
        {
            remetente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
            conteudo: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

export default mongoose.model('Chats', chatSchema);
