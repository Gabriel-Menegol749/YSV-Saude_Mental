// models/Conversa.js
import mongoose from 'mongoose';
const conversaSchema = new mongoose.Schema({
    participantes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    }],
    ultimaMensagem: {
        conteudo: { type: String },
        timestamp: { type: Date },
        remetente: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario'
        }
    },
    naoLidasContador: {
        type: Map,
        of: Number,
        default: {}
    },
}, {
    timestamps: true,
});
conversaSchema.pre('save', function(next) {
    if (this.isModified('participantes') && this.participantes.length === 2) {
        this.participantes.sort((a, b) => a.toString().localeCompare(b.toString()));
    }
    this.updatedAt = Date.now(); // Mantém o updatedAt
    next();
});
conversaSchema.index({ participantes: 1 }, { unique: true });
const Conversa = mongoose.model('Conversa', conversaSchema);
export default Conversa;
