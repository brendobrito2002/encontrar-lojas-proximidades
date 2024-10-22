const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

router.route('/stores')
    .post(storeController.createStore)
    .get(storeController.getAllStores);

router.route('/stores/:id')
    .get(storeController.getStoreById)
    .patch(storeController.updateStore)
    .delete(storeController.deleteStore);

module.exports = router;