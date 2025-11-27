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

    secoesDinamicas: [
        {
            titulo: String,
            conteudo: String
        }
    ],
    infoProfissional:{
        profissao: {type: String, enum: ['Psicólogo', 'Psiquiatra']},
        crp: String,
        especialidades: [String],
        valorConsulta: Number,
        duracaoConsulta: { type: Number, default: 50 },

        modalidadeDeAtendimento: {
            type: [String],
            enum: ['Online', 'Presencial', 'Híbrido', 'On-Line', 'On-Line e Presencial']
        },
        enderecoConsultorio: String,
        cepEnderecoConsultorio: String,
        fotosConsultorio: [String],

        formacoes:[
            {
                nome: String,
                instituicao: String,
                inicio: String,
                conclusao: String,
                certificado: String,
                aindaCursando: Boolean,
            }
        ],
    },
    perfisSalvos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }]
}, {timestamps: true});

export default mongoose.model('Usuario', usuarioSchema);