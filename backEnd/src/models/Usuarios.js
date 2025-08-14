import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true},
    email: { type: String, required: true, unique: true},
    senha: { type: String, required: true},
    telefoneContato: String,
    genero: String,
    fotoPerfil: String,
    tipoUsuario: { type: String, enum: ['Cliente', 'Profissional'], required: true},
    infoProfissional:{
        crp: String,
        especialidade: [String],
        valorConsulta: Number,
        descricao: String,
        enderecoConsultorio: String,

        ///Dados mais específicos sobre os profissionais
        certificados:[
            {
                nome: String,
                instituicao: String,
                ano: Number
            }
        ],
        experienciaProfissional: [ 
            {
                empresa: String,
                cargo: String,
                dataInicio: Date,
                dataFim: Date,
                DescricaoExp: String
            }
        ],
        modalidadeDeAtendimento:{
            type:[String],
            enum: ['Online', 'Presencial', 'Híbrido']
        },
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
        enderecoUsuario: String
    }
}, {timestamps: true});

export default mongoose.model('Usuario', usuarioSchema);