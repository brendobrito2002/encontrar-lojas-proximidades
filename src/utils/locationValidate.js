const { getAddressFromCep } = require("../services/viaCepService");
const { getCoordinatesFromCep } = require("../services/geocodeService");

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

module.exports = { validateAndGetAddressAndCoords };
