import mongoose from "mongoose";

const consultaSchema = new mongoose.Schema({
    ID_Cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true},
    ID_Profissional: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true},
    dataHorario_Consulta: { type: Date, required: true},
    valor_Consulta: { type: Number, required: true},
    statusPagamento: { type: String, enum: ['pendente', 'pago', 'cancelado'], default: 'pendente'},
    statusConsulta: {type: String, enum: ['agendada', 'realizada', 'cancelada'], default: 'agendada'},
    link_videoChamada:{ type: String},
    link_Pagamento: { type: String},
    feedBack: {type: String}
}, {timestamps: true});

export default mongoose.model('Consulta', consultaSchema);