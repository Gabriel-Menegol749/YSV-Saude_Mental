import mongoose from "mongoose";

const  mensagemSchema = new mongoose.Schema({
    conversaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversa",
        require: true,
    },
    remetente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },
    conteudo: {
        type: String,
        require: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
});
const Mensagem = mongoose.model('Mensagem', mensagemSchema);
export default  Mensagem;
