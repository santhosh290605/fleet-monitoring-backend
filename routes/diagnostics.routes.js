// routes/diagnostics.routes.js
const express = require('express');
const router = express.Router();
const diagnosticsController = require('../controllers/diagnosticsController');

router.get('/run', diagnosticsController.runDiagnostics);
router.get('/active/count', diagnosticsController.getActiveAlertCount);
router.get('/alerts/active', diagnosticsController.getActiveAlerts);
router.patch('/:id/resolve', diagnosticsController.resolveAlert);
router.get('/:id', diagnosticsController.getAlertById);


module.exports = router;
