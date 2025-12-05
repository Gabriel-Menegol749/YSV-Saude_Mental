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
            type: Number,
            enum: [0, 1, 2, 3, 4, 5, 6],
            required: true
        },
        horarios: [{ // Array de strings "HH:MM"
            type: String,
            match: /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
            required: true
        }]
    }],
    excecoes: [{
        data: {
            type: Date,
            required: true,
            set: (v) => {
                const d = new Date(v);
                d.setUTCHours(0, 0, 0, 0);
                return d;
            }
        },
        horarios: [{
            type: String,
            match: /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
            required: true
        }],
        modalidade: { // Adiciona modalidade à exceção para ser mais específico
            type: String,
            enum: ['Online', 'Presencial'],
            required: true
        }
    }]
}, { timestamps: true });

DisponibilidadeSchema.index({ profissionalId: 1, modalidade: 1 }, { unique: true });
DisponibilidadeSchema.index({ "excecoes.data": 1, "excecoes.modalidade": 1, profissionalId: 1 }); // Índice para buscar exceções mais rápido

export default mongoose.model('Disponibilidade', DisponibilidadeSchema);
