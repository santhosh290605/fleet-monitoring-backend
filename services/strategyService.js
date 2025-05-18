const axios = require('axios');
const Vehicle = require('../models/vehicle.model');
const Maintenance = require('../models/maintenance.model');
const StrategyRecommendation = require('../models/strategy_recommendation.model');
const { prepareModelInputData } = require('./dataPreparationServices');

// Custom function to ensure positive values
function ensurePositive(value, defaultValue = 0) {
  return value >= 0 ? value : defaultValue;
}

// Function to apply strategy variation for risk level only
function applyStrategyVariation(riskLevel, strategyType, confidence) {
  let adjustedRisk = riskLevel;

  // Reduce aggressive adjustments if the model has high confidence
  const riskAdjustmentFactor = 1 - (Math.abs(confidence - 0.5) * 0.5); // Use confidence to reduce overadjustment

  switch (strategyType) {
    case 0: // Delayed
      adjustedRisk = (riskLevel + 0.5) * riskAdjustmentFactor;
      break;
    case 1: // Immediate
      adjustedRisk = Math.max((riskLevel - 0.4) * riskAdjustmentFactor, 0);
      break;
    case 2: // Scheduled
      adjustedRisk = (riskLevel + 0.1) * riskAdjustmentFactor;
      break;
    default:
      break;
  }

  adjustedRisk = Math.min(Math.max(adjustedRisk, 0), 2); // Keep risk within bounds
  return adjustedRisk;
}

// Optional strategy skew adjustment to maintain balance
function adjustStrategyRecommendation(strategyProbabilities) {
  const sum = strategyProbabilities.reduce((acc, prob) => acc + prob, 0);
  const averageProb = sum / 3;

  // Avoid aggressive skewing, ensure probabilities are near the average
  if (strategyProbabilities[2] > 0.7) { // Scheduled strategy
    // Reduce the weight for the scheduled strategy if it's too high
    strategyProbabilities[2] = averageProb;
    strategyProbabilities[1] += 0.1;  // Small boost to Immediate strategy
    strategyProbabilities[0] += 0.1;  // Small boost to Delayed strategy
  }

  // Ensure probabilities sum to 1
  const total = strategyProbabilities.reduce((acc, prob) => acc + prob, 0);
  strategyProbabilities = strategyProbabilities.map(prob => prob / total);

  return strategyProbabilities;
}

async function generateStrategyRecommendation(vehicleId) {
  try {
    // 1. Prepare input data
    const {
      inputFeatures,
      vehicle,
      latestMaintenance
    } = await prepareModelInputData(vehicleId);

    if (!inputFeatures || !vehicle || !latestMaintenance) {
      throw new Error('Missing input data for strategy recommendation');
    }

    console.log('📤 Sending to ML API with input features:', JSON.stringify(inputFeatures, null, 2));

    // 2. Call the ML API
    const mlApiUrl = 'http://localhost:5000/predict';
    const response = await axios.post(mlApiUrl, inputFeatures, {
      headers: { 'Content-Type': 'application/json' }
    });

    const { strategies, best_strategy: recommendedStrategy } = response.data;

    if (!Array.isArray(strategies) || typeof recommendedStrategy !== 'number') {
      throw new Error('Prediction API returned invalid structure.');
    }

    console.log("Prediction result from API:", strategies, recommendedStrategy);

    // 3. Initialize predictions
    const predictions = {
      predicted_maintenance_cost: [],
      predicted_speed: [],
      predicted_fuel_efficiency: [],
      risk_level: []
    };

    // 4. Extract and store raw values
    strategies.forEach((strategy, index) => {
      const maintenanceCost = ensurePositive(strategy.maintenance_cost, 1);
      const rawRiskLevel = ensurePositive(strategy.risk_level, 0);
      const adjustedRisk = applyStrategyVariation(rawRiskLevel, index, strategy.score);

      predictions.predicted_maintenance_cost.push(maintenanceCost); // Raw value
      predictions.predicted_speed.push(ensurePositive(strategy.speed));
      predictions.predicted_fuel_efficiency.push(ensurePositive(strategy.fuel_efficiency));
      predictions.risk_level.push(adjustedRisk);
    });

    // 5. Adjust strategy probabilities (optional)
    const strategyProbabilities = [0, 0, 0];
    adjustStrategyRecommendation(strategyProbabilities);

    // 6. Save to MongoDB
    const newRecommendation = new StrategyRecommendation({
      vehicleId,
      latestMaintenanceId: latestMaintenance._id,
      inputFeatures,
      predictions,
      recommendedStrategy,
      modelVersion: 'v1.0',
      generatedAt: new Date()
    });

    const savedRecommendation = await newRecommendation.save();

    console.log('Saved Recommendation:', savedRecommendation);
    console.log(`✅ Strategy recommendation saved successfully for vehicle ${vehicleId}`);

    return savedRecommendation;
  } catch (error) {
    console.error(`❌ Error generating recommendation for vehicle ${vehicleId}:`, error.message || error);
    throw error;
  }
}

module.exports = { generateStrategyRecommendation };
