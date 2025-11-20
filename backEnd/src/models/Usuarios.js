import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true},
    email: { type: String, required: true, unique: true},
    senha: { type: String, required: true},
    fotoPerfil: String,
    statusOnline: {type: Boolean, default: false},
    tipoUsuario: { type: String, enum: ['Cliente', 'Profissional'], required: true},
        descricao: String,
        videoSobreMim: String,
    infoProfissional:{
        profissao: {type: String, enum: ['Psicologo', 'Psiquiatra']},
        crp: String,
        especialidades: [String],
        valorConsulta: Number,
        duracaoConsulta: { type: Number, default: 50 },

        modalidadeDeAtendimento:{ type:[String], enum: ['Online', 'Presencial', 'Híbrido']},
        enderecoConsultorio: String,
        cepEnderecoConsultorio: String,
        fotosConsultorio: [String],

        certificados:[
            {
                nome: String,
                instituicao: String,
                dataInicio: Date,
                dataConclusao: Date
            }
        ],
    },
}, {timestamps: true});

export default mongoose.model('Usuario', usuarioSchema);