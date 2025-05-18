const express = require('express');
const { getVehicleTelemetry, addTelemetry, getLatestTelemetry } = require('../controllers/telemetryController');

const router = express.Router();

// ✅ Define this BEFORE /:vehicleId
router.get('/latest', getLatestTelemetry);

// GET telemetry by vehicle ID
router.get('/:vehicleId', getVehicleTelemetry);

// POST telemetry data
router.post('/add', addTelemetry);

module.exports = router;
