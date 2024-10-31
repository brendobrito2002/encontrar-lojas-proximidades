const logger = require("../config/logger");
const Store = require('../models/storeModel');
const { getAddressFromCep } = require("../services/viaCepService");
const { getCoordinatesFromCep } = require("../services/geocodeService");

function validateStore(store, req, res) {
  if (!store) {
    logger.error("Falha na busca: Loja não encontrada para o ID especificado.", { storeId: req.params.id });
    res.status(404).json({ message: "Loja não encontrada para o ID fornecido." });
    return false;
  }
  return true;
} 

const validateStoreData = (name, cep) => {
  const newStore = new Store({ name, cep });
  const validationError = newStore.validateSync();
  if (validationError) {
    logger.error("Erro de validação nos dados da loja: Dados inválidos fornecidos.", { name, cep, error: validationError.message });
    throw new Error("Dados inválidos: " + validationError.message);
  }
};

const validateAndGetAddressAndCoords = async (cep) => {
  const address = await getAddressFromCep(cep);
  if (address.erro) {
    logger.error("Erro de validação: CEP fornecido é inválido.", { cep });
    throw new Error("CEP inválido. Verifique e tente novamente.");
  }

  const coordinates = await getCoordinatesFromCep(cep);
  if (!coordinates || !coordinates.lat || !coordinates.lng) {
    logger.error("Erro de geocodificação: Falha ao obter coordenadas para o CEP fornecido.", { cep });
    throw new Error("Não foi possível obter as coordenadas para o CEP fornecido. Verifique o CEP ou tente novamente.");
  }

  logger.info("CEP validado com sucesso e coordenadas obtidas.", { cep, lat: coordinates.lat, lng: coordinates.lng });
  return { address, coordinates };
};

function validateImmutableFields(fields, req, res) {
  const { rua, bairro, cidade, estado, lat, lng } = fields;

  if (rua || bairro || cidade || estado || lat || lng) {
      logger.warn("Tentativa de alteração de campos de endereço imutáveis detectada.", { storeId: req.params.id });
      res.status(400).json({
        message: "Alteração de campos de endereço não permitida: rua, bairro, cidade, estado, lat e lng são imutáveis.",
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