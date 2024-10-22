const Store = require('../models/storeModel');

// criar loja
exports.createStore = async (req, res) => {
    const { name, cep } = req.body;

    if(!name || !cep){
        return res.status(400).json({ message: 'Nome e CEP são obrigatórios.'});
    }

    try{
        const newStore = new Store({ name, cep });
        await newStore.save();
        res.status(201).json(newStore);
    }catch(error){
        res.status(500).json({ message: 'Erro ao criar loja.'});
    }
};

// buscar todas as lojas
exports.getAllStores = async (req, res) => {
    try{
        const stores = await Store.find();
        res.status(200).json(stores);
    }catch(error){
        res.status(500).json({ message: 'Erro ao buscar lojas.'});
    }
};

// buscar loja por id
exports.getStoreById = async (req, res) => {
    try{
        const store = await Store.findById(req.params.id);

        if(!store){
            return res.status(404).json({ message: 'Loja não encontrado.'});
        }

        res.status(200).json(store);

    }catch(error){
        res.status(500).json({ message: 'Erro ao buscar a loja.'});
    }
};

// atualizar loja
exports.updateStore = async (req, res) => {
    const { name, cep } = req.body;

    try{
        const store = await Store.findByIdAndUpdate(
            req.params.id,
            { name, cep },
            { new: true }
        );

        if(!store){
            return res.status(400).json({ message: 'Loja não encontrado.'});
        }

        res.status(200).json(store);

    }catch(error){
        res.status(500).json({ message: 'Erro ao atualizar a loja.'});
    }
};

// deletar loja
exports.deleteStore = async(req, res) => {
    try{
        const store = await Store.findByIdAndDelete(req.params.id);

        if(!store){
            res.status(404).json({ message: 'Loja não encontrada.'});
        }

        res.status(200).json({ message: 'Loja deletada com sucesso.'});

    }catch(error){
        res.status(500).json({ message: 'Erro ao deletar a Loja.'});
    }
};