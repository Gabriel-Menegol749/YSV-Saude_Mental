import mongoose from "mongoose";

const chatSchema = mongoose.Schema({
    ID_Usuario1: {type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true},
    ID_Usuario2: {type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true},
    mensagens: [{
        remetente: {type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true},
        conteudo: { type: String, required: true},
        timestamp: { type: Date, default: Date.now}
    }
]
}, {timestamps: true});

export default mongoose.model('Chats', chatSchema);