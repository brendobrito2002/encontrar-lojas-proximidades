const mongoose = require('mongoose');

const validateCep = (cep) => {
    return /^[0-9]{8}$/.test(cep);
}

const storeSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Toda loja deve possuir um nome.'],
        trim: true,
        minlength: [3, 'Um nome deve possuir no mínimo 3 caracteres.'],
        maxlength: [20, 'Um nome deve possuir no máximo 20 caracteres.']
    },
    cep: {
        type: String,
        required: [true, 'Uma loja deve possuir um CEP.'],
        trim: true,
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