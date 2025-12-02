import mongoose from "mongoose";

const DisponibilidadeSchema = new mongoose.Schema({
    profissionalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
    },
    modalidade: {
        type: String,
        enum: ['Online', 'Presencial'],
        required: true
    },
    dias: [{
        diaSemana: {
            type: String,
            // ✅ CORREÇÃO: Ajustado para os nomes curtos que você usa no MongoDB
            enum: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
            required: true
        },
        horarios: [{
            horaInicio: { type: String, required: true },
            horaFim: { type: String, required: true }
        }]
    }],
    excecoes: [{
        data: { type: Date, required: true },
        tipo: { type: String, enum: ['disponivel', 'indisponivel'], required: true },
        horarios: [{
            horaInicio: { type: String, required: true },
            horaFim: { type: String, required: true }
        }],
        bloquearDiaInteiro: { type: Boolean, default: false }
    }]
}, { timestamps: true });

DisponibilidadeSchema.index({ profissionalId: 1, modalidade: 1 }, { unique: true });

export default mongoose.model('Disponibilidade', DisponibilidadeSchema);
