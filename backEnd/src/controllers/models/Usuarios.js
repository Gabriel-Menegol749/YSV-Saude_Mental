import mongoose from "mongoose";

const usuarioSchema = new mongooose.Schema({
    nome: { type: String, required: true},
    email: { type: String, required: true, unique: true},
    senha: { type: String, required: true},
    telefoneContato: String,
    enderecoUsuario: String,
    enderecoConsultorio: String,
    genero: String,
    fotoPerfil: String,
    tipoCiente: { type: String, enum: ['Cliente', 'Profissional'], required: true},
    especialidade: String,
    valorConsulta: Number,
    descricao: String,
}, {timestamps: true});

export default mongoose.model('Usuario', usuarioSchema);