const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const USE_API_KEY = process.env.API_KEY;

async function getCoordinatesFromCep(cep) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${cep}&key=${USE_API_KEY}`;
    
    try {
        const response = await axios.get(url);
        const data = response.data;

        if (data.results && data.results.length > 0) {
            const { geometry } = data.results[0];
            return {
                lat: geometry.lat,
                lng: geometry.lng
            };
        } else {
            throw new Error('Nenhuma coordenada encontrada para o CEP indicado.');
        }
    } catch (error) {
        console.error(`Erro ao buscar coordenadas: ${error.message}`);
        throw error;
    }
}

module.exports = { getCoordinatesFromCep };