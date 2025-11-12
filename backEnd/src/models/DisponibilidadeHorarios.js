import mongoose from 'mongoose';

const DisponibilidadeSchema = new mongoose.Schema({
    profissionalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
        unique: true
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
    }]
}, { timestamps: true });

export default mongoose.model('Disponibilidade', DisponibilidadeSchema);