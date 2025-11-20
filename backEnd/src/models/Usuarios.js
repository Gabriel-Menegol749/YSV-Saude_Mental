import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true},
    email: { type: String, required: true, unique: true},
    senha: { type: String, required: true},
    fotoPerfil: String,
    statusOnline: {type: Boolean, default: false},
    tipoUsuario: { type: String, enum: ['Cliente', 'Profissional'], required: true},
    //esse descrição deve ser adicionado, editado ou removido na tela meuperfil pelo componente "Sobre Mim"
    //, tanto cliente quanto profissional devem ter a permissão de ter um video e um texto sobre mim
        descricao: String,
        videoSobreMim: String,
    infoProfissional:{
        //Alguns desses dados, além de poderem ser editáveis, eles devem servir futuramente como itens para que sejam filtrados
        //Dados esses, que devem ser editados pela interfave DadosPessoais
        profissao: {type: String, enum: ['Psicologo', 'Psiquiatra']},
        crp: String,
        especialidades: [String],
        valorConsulta: Number,
        duracaoConsulta: { type: Number, default: 50 },

        //Esses dados, devem ser atlerados pelo componente fotosConsultorio
        modalidadeDeAtendimento:{ type:[String], enum: ['Online', 'Presencial', 'Híbrido']},
        enderecoConsultorio: String,
        cepEnderecoConsultorio: String,
        fotosConsultorio: [String],

        //Esses dados, devem ser alterados pelo formacao academica
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