const Store = require('../models/storeModel');
const logger = require('../utils/logger');
const { getAddressByCep } = require('../utils/viaCepService');

// criar loja
exports.createStore = async (req, res) => {
    const { name, cep } = req.body;

    if (!name || !cep) {
        logger.error('Nome ou CEP ausente na criação da loja.', { name, cep });
        return res.status(400).json({ message: 'Nome e CEP são obrigatórios.' });
    }

    try {
        const address = await getAddressByCep(cep);

        if (address.erro) {
            logger.error('CEP inválido na criação da loja.', { cep });
            return res.status(400).json({ message: 'CEP inválido.' });
        }

        const newStore = new Store({
            name,
            cep,
            rua: address.logradouro,
            bairro: address.bairro,
            cidade: address.localidade,
            estado: address.estado
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

        if (rua || bairro || cidade || estado) {
            logger.warn('Tentativa de modificar campos de endereço protegidos.', { storeId: req.params.id });
            return res.status(400).json({ message: 'Não é permitido modificar os campos de endereço (rua, bairro, cidade, estado).' });
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

            store.cep = cep;
            store.rua = address.logradouro;
            store.bairro = address.bairro;
            store.cidade = address.localidade;
            store.estado = address.estado;
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