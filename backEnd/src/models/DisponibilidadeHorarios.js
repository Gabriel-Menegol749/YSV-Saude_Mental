import mongoose from 'mongoose';

const DisponibilidadeSchema = new mongoose.Schema({
    profissionalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
    },
    modalidade: {
        type: String,
        required: true,
        enum: ['Online', 'Presencial', 'On-Line e Presencial'],
        default: 'Online'
    },
    dias: [{
        diaSemana: {
            type: String,
            enum: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
            required: true
        },
        horarios: [{
            horaInicio: { type: String, required: true },
            horaFim: { type: String, required: true }
        }]
    }],
    execoes: [{
        data: { type: Date, required: true },
        tipo: { type: String, enum: ['disponível','indisponível'], required: true },
        horarios: [{
            horaInicio: { type: String, required: true },
            horaFim: { type: String, required: true }
        }],
        bloquearDiaInteiro: { type: Boolean, default: false }
    }]
}, { timestamps: true });

export default mongoose.model('Disponibilidade', DisponibilidadeSchema);