import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

//Imports das rotas
import autenticacaoRoutes from './src/routes/autenticacao.js'
import agendamentosRoutes from './src/routes/agendamento.js'
import profissionaisRoutes from './src/routes/profissionais.js'
import transacoesRoutes from './src/routes/transacao.js'

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('O mongoDB ta conectado!'))
    .catch(err => console.log(err));

app.get('/', (req, res) => {
    res.send('Api ta Funcionando também!');
})


app.use('/api/auth',autenticacaoRoutes);
app.use('/api/profissionais', profissionaisRoutes);
app.use('/api/agendamentos', agendamentosRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));