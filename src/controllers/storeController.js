const Store = require('../models/storeModel');
const logger = require('../utils/logger');
const { getAddressFromCep } = require('../utils/viaCepService');
const { getCoordinatesFromCep } = require('../utils/geocodeService');
const { calculateDistance } = require('../utils/haversine');

// criar loja
exports.createStore = async (req, res) => {
    const { name, cep } = req.body;

    if (!name || !cep) {
        logger.error('Nome ou CEP ausente na criação da loja.', { name, cep });
        return res.status(400).json({ message: 'Nome e CEP são obrigatórios.' });
    }

    try {
        const address = await getAddressFromCep(cep);

        if (address.erro) {
            logger.error('CEP inválido na criação da loja.', { cep });
            return res.status(400).json({ message: 'CEP inválido.' });
        }

        const coordinates = await getCoordinatesFromCep(cep);

        if(coordinates.erro){
            logger.error('Coordenadas deu ruim.');
            return res.status(400).json({ message: 'Coordenadas erro' });
        }

        const newStore = new Store({
            name,
            cep,
            rua: address.logradouro,
            bairro: address.bairro,
            cidade: address.localidade,
            estado: address.estado,
            lat: coordinates.lat,
            lng: coordinates.lng
        });

        await newStore.save();
        logger.info('Loja criada com sucesso.', { storeId: newStore._id });
        res.status(201).json(newStore);

    } catch (error) {
        logger.error('Erro ao criar loja.', { error: error.message });
        res.status(500).json({ message: 'Erro ao criar loja.' });
    }
};

// buscar todas as lojas
exports.getAllStores = async (req, res) => {
    try {
        const stores = await Store.find();
        logger.info('Sucesso ao buscar todas as lojas.');
        res.status(200).json(stores);

    } catch (error) {
        logger.error('Erro ao buscar todas as lojas.', { error: error.message });
        res.status(500).json({ message: 'Erro ao buscar lojas.' });
    }
};

// buscar loja por id
exports.getStoreById = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);

        if (!store) {
            logger.error('Loja não encontrada.', { storeId: req.params.id });
            return res.status(404).json({ message: 'Loja não encontrada.' });
        }

        logger.info('Sucesso ao buscar loja por ID.', { storeId: req.params.id });
        res.status(200).json(store);

    } catch (error) {
        logger.error('Erro ao buscar loja.', { error: error.message, storeId: req.params.id });
        res.status(500).json({ message: 'Erro ao buscar a loja.' });
    }
};

// atualizar loja
exports.updateStore = async (req, res) => {
    const { name, cep, rua, bairro, cidade, estado } = req.body;

    try {
        const store = await Store.findById(req.params.id);

        if (!store) {
            logger.error('Loja não encontrada para atualização.', { storeId: req.params.id });
            return res.status(400).json({ message: 'Loja não encontrada.' });
        }

        if (rua || bairro || cidade || estado || lat || lng) {
            logger.warn('Tentativa de modificar campos de endereço protegidos.', { storeId: req.params.id });
            return res.status(400).json({ message: 'Não é permitido modificar os campos de endereço (rua, bairro, cidade, estado, lat, lng).' });
        }

        if (name) {
            store.name = name;
        }

        if (cep && cep !== store.cep) {
            const address = await getAddressByCep(cep);

            if (address.erro) {
                logger.error('CEP inválido ao tentar atualizar loja.', { cep });
                return res.status(400).json({ message: 'CEP inválido.' });
            }

            const coordinates = await getCoordinatesFromCep(cep);

            if(coordinates.erro){
                logger.error('Coordenadas deu ruim.');
                return res.status(400).json({ message: 'Coordenadas erro' });
            }
    
            store.cep = cep;
            store.rua = address.logradouro;
            store.bairro = address.bairro;
            store.cidade = address.localidade;
            store.estado = address.estado;
            store.lat = coordinates.lat;
            store.lng = coordinates.lng;
        }

        const updatedStore = await store.save();
        logger.info('Loja atualizada com sucesso.', { storeId: updatedStore._id });
        res.status(200).json(updatedStore);

    } catch (error) {
        logger.error('Erro ao atualizar loja.', { error: error.message, storeId: req.params.id });
        res.status(500).json({ message: 'Erro ao atualizar a loja.' });
    }
};

// deletar loja
exports.deleteStore = async (req, res) => {
    try {
        const store = await Store.findByIdAndDelete(req.params.id);

        if (!store) {
            logger.error('Loja não encontrada para exclusão.', { storeId: req.params.id });
            return res.status(404).json({ message: 'Loja não encontrada.' });
        }

        logger.info('Loja deletada com sucesso.', { storeId: req.params.id });
        res.status(200).json({ message: 'Loja deletada com sucesso.' });
        
    } catch (error) {
        logger.error('Erro ao deletar loja.', { error: error.message, storeId: req.params.id });
        res.status(500).json({ message: 'Erro ao deletar a loja.' });
    }
};

// encontrar lojas próximas ao cep
exports.findAllStoresNearCep = async (req, res) => {
    const { cep } = req.params;

    console.log(`Buscando lojas próximas ao CEP: ${cep}`);

    try {
        const { lat, lng } = await getCoordinatesFromCep(cep);
        console.log(`Coordenadas encontradas - Latitude: ${lat}, Longitude: ${lng}`);

        const stores = await Store.find();
        console.log(`Total de lojas encontradas: ${stores.length}`);

        const nearbyStores = stores.filter(store => {
            console.log(`Dados da loja ${store.name}:`, store);
            if (store.cep === cep) {
                console.log(`A loja ${store.name} tem o mesmo CEP da pesquisa e será ignorada.`);
                return false;
            }
            const distance = calculateDistance(lat, lng, store.lat, store.lng);
            console.log(`Distância para a loja ${store.name}: ${distance} km`);
            return distance <= 100;
        });

        if (nearbyStores.length > 0) {
            console.log(`Lojas encontradas dentro do raio de 100 km: ${nearbyStores.length}`);
            res.status(200).json(nearbyStores);
        } else {
            console.log('Nenhuma loja encontrada dentro do raio de 100 km.');
            res.status(404).json({ message: 'Nenhuma loja encontrada dentro do raio de 100 km.' });
        }
    } catch (error) {
        console.error(`Erro: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

// encontrar a loja mais próxima ao CEP
exports.findClosestStoreByCep = async (req, res) => {
    const { cep } = req.params;

    console.log(`Buscando a loja mais próxima ao CEP: ${cep}`);

    try {
        const { lat, lng } = await getCoordinatesFromCep(cep);
        console.log(`Coordenadas encontradas - Latitude: ${lat}, Longitude: ${lng}`);

        const stores = await Store.find();
        console.log(`Total de lojas encontradas: ${stores.length}`);

        let closestStore = null;
        let shortestDistance = Infinity;

        stores.forEach(store => {
            if (store.cep === cep) {
                console.log(`A loja ${store.name} tem o mesmo CEP da pesquisa e será ignorada.`);
                return;
            }
            const distance = calculateDistance(lat, lng, store.lat, store.lng);
            console.log(`Distância para a loja ${store.name}: ${distance} km`);

            if (distance < shortestDistance) {
                shortestDistance = distance;
                closestStore = store;
            }
        });

        if (closestStore && shortestDistance <= 100) {
            console.log(`A loja mais próxima é: ${closestStore.name}, Distância: ${shortestDistance} km`);
            res.status(200).json({
                cep: closestStore.cep,
                name: closestStore.name,
                distance: shortestDistance,
                address: `${closestStore.rua}, ${closestStore.bairro}, ${closestStore.cidade} - ${closestStore.estado}`
            });
        } else {
            console.log('Nenhuma loja encontrada dentro do raio de 100 km.');
            res.status(404).json({ message: 'Nenhuma loja encontrada dentro do raio de 100 km.' });
        }
    } catch (error) {
        console.error(`Erro: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};