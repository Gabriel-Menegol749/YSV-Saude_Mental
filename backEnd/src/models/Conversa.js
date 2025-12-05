import mongoose from 'mongoose';

const conversaSchema = new mongoose.Schema({
    participantes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
        }
    ],
    mensagens: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Mensagem',
        },
    ],
    ultimaMensagem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mensagem',
        default: null,
    },
    timestampUltimaMensagem: {
        type: Date,
        default: Date.now,
    },
    naoLidasContador: {
        type: Map,
        of: Number,
        default: {},
    },
}, {
    timestamps: true,
});

conversaSchema.index({ participantes: 1 }, { unique: true });

const Conversa = mongoose.model('Conversa', conversaSchema);
export default Conversa;