const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './src/config.env' });

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

const connect = () => {
    mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.6zbxe.mongodb.net/encontrar-lojas-proximas?retryWrites=true&w=majority`)
        .then(() => {
            console.log('Conectado ao mongoDB com sucesso.');
        })
        .catch((err) => {
            console.error('Erro ao conectar com o mongoDB:', err);
        });
};

connect();

module.exports = mongoose;