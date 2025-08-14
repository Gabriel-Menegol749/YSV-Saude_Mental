import mongoose from "mongoose";

const transacaoSchema = new mongoose.Schema({
    Id_Usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true},
    ID_consulta: { type: mongoose.Schema.Types.ObjectId, ref: 'Consulta', required: true},
    formaPagamento: { type: String, enum:['pix', 'crédito', 'débito', 'presencial'], required: true},
    statusPagamento: { type: String, enum: ['pendente', 'pago', 'cancelado'], default: 'pendente'},
    data_HorarioPagamento: { type: Date },
    comprovante: String
}, {timestamps: true});

export default mongoose.model('Transacao', transacaoSchema);