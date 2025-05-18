// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/top-cards', dashboardController.getTopCardsData);
router.get('/strategy-overview', dashboardController.getStrategyOverview);


module.exports = router;
