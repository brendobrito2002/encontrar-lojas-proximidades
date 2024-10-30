const Store = require("../models/storeModel");
const logger = require("../config/logger");
const { getCoordinatesFromCep } = require("../services/geocodeService");
const { calculateDistance } = require("../utils/haversine");

async function filterNearbyStores(cep) {
  const { lat, lng } = await getCoordinatesFromCep(cep);
  logger.info(
    `Coordenadas obtidas para o CEP - Latitude: ${lat}, Longitude: ${lng}`
  );

  const stores = await Store.find();
  logger.info(
    `Total de lojas carregadas para busca de proximidade: ${stores.length}`
  );

  return stores.filter((store) => {
    if (store.cep === cep) {
      return false;
    }
    const distance = calculateDistance(lat, lng, store.lat, store.lng);
    logger.info(`Distância da loja ${store.name}: ${distance.toFixed(2)} km`);
    return distance <= 100;
  });
}

async function filterClosestStore(cep) {
  const { lat, lng } = await getCoordinatesFromCep(cep);
  logger.info(`Coordenadas obtidas para o CEP - Latitude: ${lat}, Longitude: ${lng}`);

  const stores = await Store.find();
  logger.info(`Total de lojas carregadas para busca de loja mais próxima: ${stores.length}`);

  let closestStore = null;
  let shortestDistance = Infinity;

  stores.forEach(store => {
    if (store.cep === cep){
      return;
    }
    const distance = calculateDistance(lat, lng, store.lat, store.lng);
    logger.info(`Distância da loja ${store.name}: ${distance.toFixed(2)} km`);
    if (distance < shortestDistance && distance <= 100) {
      shortestDistance = distance;
      closestStore = {
        cep: store.cep,
        name: store.name,
        distance: distance.toFixed(2),
        rua: store.rua,
        bairro: store.bairro,
        cidade: store.cidade,
        estado: store.estado,
      };
    }
  });
  return closestStore;
}

module.exports = { filterNearbyStores, filterClosestStore };