const logger = require("../config/logger");
const Store = require('../models/storeModel');
const { getAddressFromCep } = require("../services/viaCepService");
const { getCoordinatesFromCep } = require("../services/geocodeService");

function validateStore(store, req, res) {
    if (!store) {
      logger.error("Loja não encontrada para o ID especificado.", { storeId: req.params.id });
      res.status(404).json({ message: "Loja não encontrada." });
      return false;
    }
    return true;
} 

const validateStoreData = (name, cep) => {
    const newStore = new Store({ name, cep });
    const validationError = newStore.validateSync();
    if (validationError) {
      throw new Error(validationError.message);
    }
};

const validateAndGetAddressAndCoords = async (cep) => {
    const address = await getAddressFromCep(cep);
    if (address.erro) {
      throw new Error("CEP fornecido é inválido.");
    }
  
    const coordinates = await getCoordinatesFromCep(cep);
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      throw new Error("Não foi possível obter as coordenadas para o CEP fornecido.");
    }
  
    return { address, coordinates };
};

function validateImmutableFields(fields, req, res){
    const { rua, bairro, cidade, estado, lat, lng } = fields;

    if (rua || bairro || cidade || estado || lat || lng) {
        logger.warn("Tentativa de modificar campos de endereço protegidos.", 
            {storeId: req.params.id,});
        res.status(400).json({
          message:`Não é permitido modificar os campos de endereço (rua, bairro, cidade, estado, lat, lng).`,
        });
        return true;
    }
    return false;
}

module.exports = { 
    validateStoreData, 
    validateStore, 
    validateAndGetAddressAndCoords, 
    validateImmutableFields 
};