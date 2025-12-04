import mongoose from 'mongoose';

const NotificacaoSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    tipo: {
      type: String,
      required: true,
    },
    dados: {
      type: Object,
      default: {},
    },
    lida: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Notificacao', NotificacaoSchema);
