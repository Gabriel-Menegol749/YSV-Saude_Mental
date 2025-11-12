import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true},
    email: { type: String, required: true, unique: true},
    senha: { type: String, required: true},
    telefoneContato: String,
    genero: String,
    fotoPerfil: String,
    statusOnline: {type: Boolean, default: false},
    tipoUsuario: { type: String, enum: ['Cliente', 'Profissional'], required: true},
    infoProfissional:{
        profissao: {type: String, enum: ['Psicologo', 'Psiquiatra']},
        crp: String,
        especialidades: [String],
        valorConsulta: Number,
        duracaoConsulta: { type: Number, default: 50 },
        descricao: String,
        enderecoConsultorio: String,
        fotosConsultorio: [String],

        ///Dados mais específicos sobre os profissionais
        certificados:[
            {
                nome: String,
                instituicao: String,
                ano: Number
            }
        ],
        modalidadeDeAtendimento:{ type:[String], enum: ['Online', 'Presencial', 'Híbrido']},
        disponibilidade:[
            {
                diaDaSemana:{
                    type: String,
                    enum: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
                },
                horarioInicio: String,
                horarioFim: String
            }
        ]

    },
    infoCliente:{
        resumoPessoal: String,
        enderecoUsuario: String
    }
}, {timestamps: true});

export default mongoose.model('Usuario', usuarioSchema);