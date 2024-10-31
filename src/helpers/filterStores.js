const Store = require("../models/storeModel");
const logger = require("../config/logger");
const { getCoordinatesFromCep } = require("../services/geocodeService");
const { calculateDistance } = require("../utils/haversine");

async function filterNearbyStores(cep) {
  const { lat, lng } = await getCoordinatesFromCep(cep);
  logger.info("Coordenadas obtidas para o CEP fornecido", { cep, lat, lng });

  const stores = await Store.find();
  logger.info(`Carregamento de lojas concluído para busca de proximidade. Total: ${stores.length}`);

  return stores.filter((store) => {
    if (store.cep === cep) {
      logger.warn("Loja com CEP igual ao do usuário foi ignorada.", { storeId: store._id });
      return false;
    }
    const distance = calculateDistance(lat, lng, store.lat, store.lng);
    logger.info("Distância calculada para loja", { storeId: store._id, distance });
    return distance <= 100;
  });
}

async function filterClosestStore(cep) {
  const { lat, lng } = await getCoordinatesFromCep(cep);
  logger.info("Coordenadas obtidas para o CEP fornecido", { cep, lat, lng });

  const stores = await Store.find();
  logger.info(`Carregamento de lojas concluído para busca da loja mais próxima. Total: ${stores.length}`);

  let closestStore = null;
  let shortestDistance = Infinity;

  stores.forEach(store => {
    if (store.cep === cep) {
      logger.warn("Loja com o mesmo CEP foi ignorada.", { storeId: store._id });
      return;
    }
    const distance = calculateDistance(lat, lng, store.lat, store.lng);
    logger.info("Distância calculada para loja", { storeId: store._id, distance });
    if (distance < shortestDistance && distance <= 100) {
      shortestDistance = distance;
      closestStore = {
        cep: store.cep,
        name: store.name,
        rua: store.rua,
        bairro: store.bairro,
        cidade: store.cidade,
        estado: store.estado,
        distancia: distance.toFixed(2)
      };
    }
  });
  return closestStore;
}

module.exports = { filterNearbyStores, filterClosestStore };