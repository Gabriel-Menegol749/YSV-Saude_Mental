import mongoose from "mongoose";

const consultaSchema = new mongoose.Schema({
    clienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    profissionalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    data: {
        type: Date,
        required: true
    },
    horario: {
        type: String,
        required: true
    },
    modalidade: {
        type: String,
        enum: ['Online', 'Presencial'],
        required: true
    },
    valor: {
        type: Number,
        required: true
    },
    duracao: {
        type: Number,
        required: true
    },
    statusPagamento: {
        type: String,
        enum: ['pendente', 'pago', 'cancelado'],
        default: 'pendente'
    },
    statusConsulta: {
        type: String,
        enum: ['solicitada', 'confirmada', 'reagendamento_solicitado', 'recusada', 'realizada', 'cancelada', 'finalizada'],
        default: 'solicitada'
    },
    link_videoChamada: { type: String },
    link_Pagamento: { type: String },
    historicoAcoes: [
        {
            acao: { type: String, enum: ['Solicitada', 'Confirmada', 'Recusada', 'Reagendada', 'Cancelada', 'Finalizada'] },
            porUsuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
            dataAcao: { type: Date, default: Date.now }
        }
    ],
    feedBack: {
        nota: { type: Number, min: 1, max: 5 },
        comentario: String,
        dataFeedback: { type: Date }
    }
}, { timestamps: true });

export default mongoose.model('Consulta', consultaSchema);
