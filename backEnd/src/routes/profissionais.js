import express from 'express';
import Usuarios from '../models/Usuarios.js';


//Nesse arquivo coloquei as funcionalidades relacionadas aos profissionais, cá temos a 
//função de filtros de profissionais, atualizaçao de perfis (que deve ser feito por eles mesmos)
const router = express.Router();

//Função de filtragem
router.get('/', async (req, res) =>{
    try{
        const { especialidade, modalidade, valorMin, valorMax } = req.query;
        let query = { tipoUsuario: 'Profissional'};

        if(modalidade){
            query['informacoesProfissional.modalidadesDeAtendimento'] = { $in: [modalidade] };
        }

        if( valorMin || valorMax){
            query['informacoesProfissional.valorConsulta'] = {};;
            if(valorMin){
                query['informacoesProfissional.valorConsulta']['$gte'] = parseFloat(valorMin);
            }
            if(valorMax){
                query['informacoesProfissional.valorConsulta']['$lte'] = parseFloat(valorMax);
            }
        }
        const profissionais = await Usuarios.find(query);
        res.json(profissionais);

    } catch(err){
        console.error(err.message);
        res.status(500).send('Erro no servidor.');
    }
});


///Função put de atualização de perfil de profissionais
router.put('/perfil', async (req, res) =>{
    //fazer esse id virar um token jwt futuramente
    const { idProfissional } = req.body;
    const {
        telefoneContato,
        enderecoConsultorio,
        genero,
        fotoPerfil,
        especialidades,
        valorConsulta,
        descricao,
        certificados,
        experienciaProfissional,
        modalidadesDeAtendimento,
        disponibilidade
    } = req.body;

    try{
        const usuario = await Usuarios.findById(idProfissional);
        if(!usuario || usuario.tipoUsuario !== 'Profissional'){
            return res.status(404).json({msg: 'Profissional não encontrado!'});
        }

        //formulário de atualização de dados do profissional
        if (telefoneContato) usuario.telefoneContato = telefoneContato;
        if (genero) usuario.genero = genero;
        if (fotoPerfil) usuario.fotoPerfil = fotoPerfil;

        if (informacoesProfissional) {
            const profInfo = usuario.infoProfissional;
            if (informacoesProfissional.enderecoConsultorio) profInfo.enderecoConsultorio = informacoesProfissional.enderecoConsultorio;
            if (informacoesProfissional.especialidades) profInfo.especialidades = informacoesProfissional.especialidades;
            if (informacoesProfissional.valorConsulta) profInfo.valorConsulta = informacoesProfissional.valorConsulta;
            if (informacoesProfissional.descricao) profInfo.descricao = informacoesProfissional.descricao;
            if (informacoesProfissional.certificados) profInfo.certificados = informacoesProfissional.certificados;
            if (informacoesProfissional.experienciaProfissional) profInfo.experienciaProfissional = informacoesProfissional.experienciaProfissional;
            if (informacoesProfissional.modalidadesDeAtendimento) profInfo.modalidadesDeAtendimento = informacoesProfissional.modalidadesDeAtendimento;
            if (informacoesProfissional.disponibilidade) profInfo.disponibilidade = informacoesProfissional.disponibilidade;
        }

        await usuario.save();
        res.json({msg: 'Usuário atualizado com sucesso!', usuario});

    } catch(err){
        console.error(err.message);
        res.status(500).send('Erro no servidor.');

    }
})

export default router;