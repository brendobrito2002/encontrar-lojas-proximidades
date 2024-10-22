const mongoose = require('mongoose');

const validateCep = (cep) => {
    return /^[0-9]{8}$/.test(cep);
}

const storeSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    cep: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate: {
            validator: validateCep,
            message: 'CEP inválido. Deve conter 8 dígitos númericos.'
        }
    },
    rua: {
        type: String
    },
    bairro: {
        type: String  
    },
    cidade: {
        type: String
    },
    estado: {
        type: String
    }
});

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;