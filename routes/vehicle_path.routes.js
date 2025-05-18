const express = require('express');
const router = express.Router();
const { getVehiclePathByVehicleId , createPathForVehicle } = require('../controllers/vehiclePathController');

// @route GET /api/vehicle-path/:vehicleId
router.get('/:vehicleId', getVehiclePathByVehicleId);
router.post('/generate/:vehicleId', createPathForVehicle);

module.exports = router;
