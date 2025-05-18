const express = require('express');
const router = express.Router();
const { getLatestRecommendation , getTopRiskVehicles } = require('../controllers/strategyRecommendationController');

router.get('/latest/:vehicleId', getLatestRecommendation);
router.get('/top-risk', getTopRiskVehicles);

module.exports = router;
