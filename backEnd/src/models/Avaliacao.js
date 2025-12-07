import mongoose from 'mongoose';

const avaliacaoSchema = mongoose.Schema({
    profissional: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    nota: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comentario: {
        type: String,
        trim: true,
        default: ''
    },
    anonimo: {
        type: Boolean,
        default: false
    },
    data: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Avaliacao = mongoose.model('Avaliacao', avaliacaoSchema);

export default Avaliacao;