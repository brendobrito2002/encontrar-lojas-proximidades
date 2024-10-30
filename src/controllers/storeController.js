const Store = require("../models/storeModel");
const logger = require("../config/logger");
const { filterNearbyStores, filterClosestStore } = require("../helpers/filterStores");
const { validateStore, validateStoreData, validateAndGetAddressAndCoords, 
      validateImmutableFields } = require('../helpers/storeValidate');

// criar loja
exports.createStore = async (req, res) => {
  const { name, cep } = req.body;

  if (!name || !cep) {
    logger.error("Falha na criação da loja: Nome ou CEP ausente.", { name, cep });
    return res.status(400).json({ message: "Nome e CEP são campos obrigatórios." });
  }

  try {
    validateStoreData(name, cep);
    const { address, coordinates } = await validateAndGetAddressAndCoords(cep);

    const newStore = new Store({
      name,
      cep,
      rua: address.logradouro,
      bairro: address.bairro,
      cidade: address.localidade,
      estado: address.estado,
      lat: coordinates.lat,
      lng: coordinates.lng,
    });

    await newStore.save();

    logger.info("Loja criada com sucesso.", { storeId: newStore._id });
    res.status(201).json({ message: "Loja criada com sucesso!", store: newStore });
  } catch (error) {
    logger.error("Erro ao criar a loja.", { error: error.message });
    res.status(500).json({ message: error.message });
  }
};

// buscar todas as lojas
exports.getAllStores = async (req, res) => {
  try {
    const stores = await Store.find();

    logger.info("Todas as lojas foram buscadas com sucesso.");
    res.status(200).json(stores);
  } catch (error) {
    logger.error("Erro ao buscar todas as lojas.", { error: error.message });
    res.status(500).json({ message: "Erro ao tentar buscar lojas." });
  }
};

// buscar loja por id
exports.getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!validateStore(store, req, res)) return;

    logger.info("Loja buscada com sucesso por ID.", { storeId: req.params.id });
    res.status(200).json(store);
  } catch (error) {
    logger.error("Erro ao buscar loja por ID.", { error: error.message, storeId: req.params.id });
    res.status(500).json({ message: "Erro ao tentar buscar a loja." });
  }
};

// atualizar loja
exports.updateStore = async (req, res) => {
  const { name, cep } = req.body;

  try {
    const store = await Store.findById(req.params.id);
    if (!validateStore(store, req, res)) return;
    if (validateImmutableFields(req.body, req, res)) return;

    if (name && name !== store.name) {
      store.name = name;
    }

    if (cep && cep !== store.cep) {
      const { address, coordinates } = await validateAndGetAddressAndCoords(cep);
      store.cep = cep;
      store.rua = address.logradouro;
      store.bairro = address.bairro;
      store.cidade = address.localidade;
      store.estado = address.estado;
      store.lat = coordinates.lat;
      store.lng = coordinates.lng;
    }

    const updatedStore = await store.save();

    logger.info("Loja atualizada com sucesso.", { storeId: updatedStore._id });
    res.status(200).json({ message: "Loja atualizada com sucesso!", store: updatedStore });
  } catch (error) {
    logger.error("Erro ao atualizar loja.", { error: error.message, storeId: req.params.id });
    res.status(500).json({ message: error.message });
  }
};

// deletar loja
exports.deleteStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!validateStore(store, req, res)) return;

    logger.info("Loja excluída com sucesso.", { storeId: req.params.id });
    res.status(200).json({ message: "Loja excluída com sucesso." });
  } catch (error) {
    logger.error("Erro ao excluir loja.", { error: error.message, storeId: req.params.id });
    res.status(500).json({ message: "Erro ao ao excluir a loja." });
  }
};

// encontrar lojas próximas ao CEP
exports.findAllStoresNearCep = async (req, res) => {
  const { cep } = req.params;

  try {
    const nearbyStores = await filterNearbyStores(cep);

    if (nearbyStores.length > 0) {
      res.status(200).json(nearbyStores);
    } else {
      res.status(404).json({ message: "Nenhuma loja encontrada dentro do raio de 100 km." });
    }
  } catch (error) {
    logger.error(`Erro ao buscar lojas próximas ao CEP ${cep}: ${error.message}`);
    res.status(500).json({ message: "Erro ao buscar lojas próximas ao CEP fornecido." });
  }
};

// encontrar a loja mais próxima ao CEP
exports.findClosestStoreByCep = async (req, res) => {
  const { cep } = req.params;

  try {
    const closestStore = await filterClosestStore(cep);

    if (closestStore) {
      logger.info(`A loja mais próxima do CEP: ${cep} é ${closestStore.name}.`);
      res.status(200).json(closestStore);
    } else {
      res.status(404).json({ message: "Nenhuma loja encontrada dentro do raio de 100 km." });
    }
  } catch (error) {
    logger.error(`Erro ao buscar a loja mais próxima ao CEP ${cep}: ${error.message}`);
    res.status(500).json({ message: "Erro ao buscar a loja mais próxima ao CEP fornecido." });
  }
};