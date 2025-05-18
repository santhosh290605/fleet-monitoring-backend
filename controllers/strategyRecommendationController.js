const StrategyRecommendation = require('../models/strategy_recommendation.model');

exports.getLatestRecommendation = async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const recommendation = await StrategyRecommendation
      .findOne({ vehicleId })
      .sort({ generatedAt: -1 });

    if (!recommendation) {
      return res.status(404).json({ message: 'No strategy found for this vehicle' });
    }

    const rawPredictions = recommendation.predictions || {};
    const cleanedPredictions = { "0": {}, "1": {}, "2": {} };

    for (const [key, value] of Object.entries(rawPredictions)) {
      if (Array.isArray(value)) {
        cleanedPredictions["0"][key] = value[0] ?? null;
        cleanedPredictions["1"][key] = value[1] ?? null;
        cleanedPredictions["2"][key] = value[2] ?? null;
      } else {
        cleanedPredictions["0"][key] = value ?? null;
        cleanedPredictions["1"][key] = value ?? null;
        cleanedPredictions["2"][key] = value ?? null;
      }
    }

    const response = {
      _id: recommendation._id,
      vehicleId: recommendation.vehicleId,
      latestMaintenanceId: recommendation.latestMaintenanceId,
      recommendedStrategy: recommendation.recommendedStrategy,
      modelVersion: recommendation.modelVersion,
      generatedAt: recommendation.generatedAt,
      predictions: cleanedPredictions
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching latest strategy recommendation:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

exports.getTopRiskVehicles = async (req, res) => {
  try {
    const latestStrategies = await StrategyRecommendation.aggregate([
      { $sort: { generatedAt: -1 } },
      { $group: { _id: "$vehicleId", latest: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$latest" } }
    ]);

    console.log("Fetched latestStrategies:", latestStrategies.length);

    const atRiskVehicles = latestStrategies
      .map((strategyDoc) => {
        const { vehicleId, recommendedStrategy, predictions, generatedAt } = strategyDoc;
        const strategyIdx = recommendedStrategy;

        const riskLevel = predictions?.risk_level?.[strategyIdx];
        if (riskLevel === undefined) {
          console.log(`No risk_level found for vehicle ${vehicleId} strategy ${strategyIdx}`);
          console.log(`Available prediction keys:`, Object.keys(predictions));
          return null;
        }

        return {
          vehicleId,
          recommendedStrategy: strategyIdx,
          riskLevel,
          cost: predictions?.predicted_maintenance_cost?.[strategyIdx] ?? null,
          fuel: predictions?.predicted_fuel_efficiency?.[strategyIdx] ?? null,
          generatedAt
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.riskLevel - a.riskLevel)
      .slice(0, 5);

    res.status(200).json(atRiskVehicles);
  } catch (error) {
    console.error('Error fetching top-risk vehicles:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
