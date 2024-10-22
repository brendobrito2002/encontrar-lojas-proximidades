const axios = require('axios');

const getAddressByCep = async(cep) => {
    try{
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        return response.data;
    }catch(erro){
        throw new Error('Erro ao consultar o ViaCEP.');
    }
};

module.exports = { getAddressByCep };