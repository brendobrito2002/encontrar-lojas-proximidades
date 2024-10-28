const Store = require("../models/storeModel");
const logger = require("../config/logger");
// const { getAddressFromCep } = require("../services/viaCepService");
const { getCoordinatesFromCep } = require("../services/geocodeService");
const { calculateDistance } = require("../utils/haversine");
const { validateAndGetAddressAndCoords } = require("../utils/locationValidate");

// criar loja
exports.createStore = async (req, res) => {
  const { name, cep } = req.body;

  if (!name || !cep) {
    logger.error("Falha na criação da loja: Nome ou CEP ausente.", {
      name,
      cep,
    });
    return res
      .status(400)
      .json({ message: "Nome e CEP são campos obrigatórios." });
  }

  try {
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
    res
      .status(201)
      .json({ message: "Loja criada com sucesso!", store: newStore });
  } catch (error) {
    logger.error("Erro interno ao criar a loja.", { error: error.message });
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
    res.status(500).json({ message: "Erro interno ao tentar buscar lojas." });
  }
};

// buscar loja por id
exports.getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      logger.error("Loja não encontrada para o ID especificado.", {
        storeId: req.params.id,
      });
      return res.status(404).json({ message: "Loja não encontrada." });
    }

    logger.info("Loja buscada com sucesso por ID.", { storeId: req.params.id });
    res.status(200).json(store);
  } catch (error) {
    logger.error("Erro ao buscar loja por ID.", {
      error: error.message,
      storeId: req.params.id,
    });
    res.status(500).json({ message: "Erro interno ao tentar buscar a loja." });
  }
};

// atualizar loja
exports.updateStore = async (req, res) => {
  const { name, cep, rua, bairro, cidade, estado, lat, lng } = req.body;

  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      logger.error("Loja não encontrada para atualização.", {
        storeId: req.params.id,
      });
      return res.status(400).json({ message: "Loja não encontrada." });
    }

    if (rua || bairro || cidade || estado || lat || lng) {
      logger.warn("Tentativa de modificar campos de endereço protegidos.", {
        storeId: req.params.id,
      });
      return res.status(400).json({
        message:
          "Não é permitido modificar os campos de endereço (rua, bairro, cidade, estado, lat, lng).",
      });
    }

    if (name) {
      store.name = name;
    }

    if (cep && cep !== store.cep) {
      const { address, coordinates } = await validateAndGetAddressAndCoords(
        cep
      );

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
    res
      .status(200)
      .json({ message: "Loja atualizada com sucesso!", store: updatedStore });
  } catch (error) {
    logger.error("Erro ao atualizar loja.", {
      error: error.message,
      storeId: req.params.id,
    });
    res.status(500).json({ message: error.message });
  }
};

// deletar loja
exports.deleteStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);

    if (!store) {
      logger.error("Loja não encontrada para exclusão.", {
        storeId: req.params.id,
      });
      return res.status(404).json({ message: "Loja não encontrada." });
    }

    logger.info("Loja excluída com sucesso.", { storeId: req.params.id });
    res.status(200).json({ message: "Loja excluída com sucesso." });
  } catch (error) {
    logger.error("Erro ao excluir loja.", {
      error: error.message,
      storeId: req.params.id,
    });
    res.status(500).json({ message: "Erro ao interno ao excluir a loja." });
  }
};

// encontrar lojas proximas ao cep
exports.findAllStoresNearCep = async (req, res) => {
  const { cep } = req.params;

  logger.info(`Iniciando busca de lojas próximas ao CEP: ${cep}`);

  try {
    const { lat, lng } = await getCoordinatesFromCep(cep);
    logger.info(
      `Coordenadas obtidas para o CEP - Latitude: ${lat}, Longitude: ${lng}`
    );

    const stores = await Store.find();
    logger.info(
      `Total de lojas carregadas para busca de proximidade: ${stores.length}`
    );

    const nearbyStores = stores.filter((store) => {
      if (store.cep === cep) {
        logger.info(`Ignorando a loja ${store.name} com o mesmo CEP da busca.`);
        return false;
      }
      const distance = calculateDistance(lat, lng, store.lat, store.lng);
      logger.info(`Distância da loja ${store.name}: ${distance.toFixed(2)} km`);
      return distance <= 100;
    });

    if (nearbyStores.length > 0) {
      logger.info(`Lojas encontradas dentro de 100 km: ${nearbyStores.length}`);
      res.status(200).json(nearbyStores);
    } else {
      logger.info("Nenhuma loja encontrada dentro do raio de 100 km.");
      res
        .status(404)
        .json({ message: "Nenhuma loja encontrada dentro do raio de 100 km." });
    }
  } catch (error) {
    logger.error(
      `Erro ao buscar lojas próximas ao CEP ${cep}: ${error.message}`
    );
    res
      .status(500)
      .json({ message: "Erro ao buscar lojas próximas ao CEP fornecido." });
  }
};

// encontrar a loja mais proxima ao CEP
exports.findClosestStoreByCep = async (req, res) => {
  const { cep } = req.params;

  logger.info(`Iniciando busca pela loja mais próxima ao CEP: ${cep}`);

  try {
    const { lat, lng } = await getCoordinatesFromCep(cep);
    logger.info(
      `Coordenadas obtidas para o CEP - Latitude: ${lat}, Longitude: ${lng}`
    );

    const stores = await Store.find();
    logger.info(
      `Total de lojas carregadas para busca de loja mais próxima: ${stores.length}`
    );

    let closestStore = null;
    let shortestDistance = Infinity;

    stores.forEach((store) => {
      if (store.cep === cep) {
        logger.info(`Ignorando a loja ${store.name} com o mesmo CEP da busca.`);
        return;
      }
      const distance = calculateDistance(lat, lng, store.lat, store.lng);
      logger.info(`Distância da loja ${store.name}: ${distance.toFixed(2)} km`);

      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestStore = store;
      }
    });

    if (closestStore && shortestDistance <= 100) {
      logger.info(
        `A loja mais próxima é ${
          closestStore.name
        }, a ${shortestDistance.toFixed(2)} km de distância.`
      );
      res.status(200).json({
        cep: closestStore.cep,
        name: closestStore.name,
        distance: shortestDistance.toFixed(2),
        rua: closestStore.rua,
        bairro: closestStore.bairro,
        cidade: closestStore.cidade,
        estado: closestStore.estado,
      });
    } else {
      logger.info("Nenhuma loja encontrada dentro do raio de 100 km.");
      res
        .status(404)
        .json({ message: "Nenhuma loja encontrada dentro do raio de 100 km." });
    }
  } catch (error) {
    logger.error(
      `Erro ao buscar a loja mais próxima ao CEP ${cep}: ${error.message}`
    );
    res.status(500).json({
      message: "Erro ao buscar a loja mais próxima ao CEP fornecido.",
    });
  }
};
