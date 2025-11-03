import Mensagem from "./Mensagem";

const ChatSchema = new mongoose.Schema({
    participantes: [{ type:mongoose.Schema.Types.ObjectId, ref: "Usuario"}],
    mensagens: [Mensagem.schema],
});