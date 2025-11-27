const express = require('express');
const router = express.Router();
const { getAddressConfig, createEstateAddress } = require('../controllers/estateConfigController');

router.post('/create', createEstateAddress);    // Create a new estate
router.get('/get_estates/:id', getAddressConfig);// get estate

module.exports = router;
