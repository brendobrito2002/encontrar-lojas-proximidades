const logger = require("../config/logger");

function validateStore(store, req, res) {
  if (!store) {
    logger.error("Loja não encontrada para o ID especificado.", { storeId: req.params.id });
    res.status(404).json({ message: "Loja não encontrada." });
    return false;
  }
  return true;
}

module.exports = { validateStore };