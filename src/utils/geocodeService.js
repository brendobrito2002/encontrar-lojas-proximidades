const axios = require('axios');
const API_KEY = '82740c82925e436cbad2268c2371a88a';

async function getCoordinatesFromCep(cep) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${cep}&key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

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
        throw error; // Lança o erro para ser tratado na camada superior
    }
}

module.exports = { getCoordinatesFromCep };