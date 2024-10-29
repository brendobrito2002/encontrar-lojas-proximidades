const logger = require('../config/logger');

function validateImmutableFields(fields, req, res){
    const { rua, bairro, cidade, estado, lat, lng } = fields;

    if (rua || bairro || cidade || estado || lat || lng) {
        logger.warn("Tentativa de modificar campos de endereço protegidos.", 
            {storeId: req.params.id,});
        res.status(400).json({
          message:
            `Não é permitido modificar os campos de endereço 
            (rua, bairro, cidade, estado, lat, lng).`,
        });
        return true;
    }
    return false;
}

module.exports = { validateImmutableFields };