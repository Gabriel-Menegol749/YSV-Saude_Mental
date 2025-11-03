import mongoose from "mongoose";

const conectarDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Conectado com Sucesso!:');
    } catch(err){
        console.error(`Erro: ${err.message}`);
        process.exit(1);
    }
}

export default conectarDB;