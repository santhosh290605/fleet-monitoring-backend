const Vehicle = require('../models/vehicle.model');
const Maintenance = require('../models/maintenance.model');
const StrategyRecommendation = require('../models/strategy_recommendation.model');

const { prepareModelInputData } = require('./dataPreparationServices');
const { simulateModelPredictions } = require('./mockPredictionService');

async function generateAndStoreStrategyRecommendation(vehicleId) {
  try {
    // 1. Fetch vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    // 2. Fetch latest maintenance record
    const latestMaintenance = await Maintenance.findOne({ vehicleId }).sort({ date: -1 });
    if (!latestMaintenance) throw new Error('No maintenance record found for this vehicle');

    // 3. Prepare input features for the model
    const inputFeatures = prepareModelInputData(vehicle, latestMaintenance);

    // 4. Get predictions from mock model
    const predictions = simulateModelPredictions(inputFeatures);

    // 5. Create and save recommendation
    const newRecommendation = new StrategyRecommendation({
      vehicleId,
      latestMaintenanceId: latestMaintenance._id, // ✅ Matches schema
      inputFeatures,
      predictions,
      recommendedStrategy: predictions.recommendedStrategy, // Explicitly stored
      modelVersion: "v1.0",
      generatedAt: new Date()
    });

    await newRecommendation.save();

    console.log("✅ Strategy recommendation saved!");
    return newRecommendation;
  } catch (error) {
    console.error('❌ Error generating recommendation:', error);
    throw error;
  }
}

module.exports = { generateAndStoreStrategyRecommendation };
