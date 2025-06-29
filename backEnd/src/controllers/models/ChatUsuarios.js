import mongoose from "mongoose";

const chatUsuariosSchema = mongoose.Schema({
    ID_Usuario1: {type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true},
    ID_Usuario2: {type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true},
    mensagens: [{
        remetente: {type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true},
        conteudo: { type: string, required: true},
        timestamp: { type: date, default: date.now}
    }
]
}, {timestamps: true});

export default mongoose.model('ChatUsuarios', chatUsuariosSchema);