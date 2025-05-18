const express = require('express');
const { getMaintenanceRecords, addMaintenance } = require('../controllers/maintenanceController');
const MaintenanceRecord = require('../models/maintenance.model')

const router = express.Router();

// GET maintenance by vehicle ID
router.get('/:vehicleId', getMaintenanceRecords);

router.post('/:id/add', addMaintenance);

module.exports = router;
