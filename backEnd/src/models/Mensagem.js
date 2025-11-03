import mongoose from "mongoose";

const  mensagemSchema = new mongoose.Schema({
    remetente: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true},
    conteudo: { type: String, require: true},
    timestamp: { type: Date, default: Date.now},
});

export default mongoose.model('Mensagem', mensagemSchema);
