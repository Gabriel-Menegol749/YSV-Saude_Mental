import mongoose from "mongoose";

const consultaSchema = new mongoose.Schema({
    ID_Cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true},
    ID_Profissional: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true},
    dataHorario_Consulta: { type: Date, required: true},
    valor_Consulta: { type: Number, required: true},
    statusPagamento: { type: String, enum: ['pendente', 'pago', 'cancelado'], default: 'pendente'},

    statusConsulta: {type: String, enum: [ 'solicitada', 'confirmada', 'reagendamento_solicitado','recusada', 'realizada', 'cancelada'], default: 'solicitada'},
    tipoModalidade: {type: String, enum: ['Online', 'Presencial', 'Híbrido'], required: true },
    link_videoChamada:{ type: String},
    link_Pagamento: { type: String},

    historicoAcoes: [
        {
            acao: { type: String, enum: ['Solicitada', 'Confirmada', 'Recusada', 'Reagendada', 'Cancelada']},
            porUsuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario'},
            dataAcao: { type: Date, default: Date.now }
        }
    ],
    feedBack: {
        nota: { type: Number, min: 1, max: 5 },
        comentario: String,
        dataFeedback: { type: Date }
    }
}, {timestamps: true});

export default mongoose.model('Consulta', consultaSchema);