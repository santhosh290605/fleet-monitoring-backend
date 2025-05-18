const mongoose = require("mongoose");

const strategyRecommendationSchema = new mongoose.Schema({
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    latestMaintenanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Maintenance', required: true },
  
    inputFeatures: {
      daysSinceLastMaintenance: Number,
      maintenanceInterval: Number,
      lastMaintenanceCost: Number,
      engineHealth: Number,
      oilQuality: Number,
      tireWear: Number,
      vehicleAge: Number,
      maintenanceQualityScore: Number,
      unexpectedFailures: Number
    },
  
    // Predictions for different strategies (0 = Delayed, 1 = Immediate, 2 = Scheduled)
    predictions: {
      predicted_maintenance_cost: [Number], // index 0: delayed, 1: immediate, 2: scheduled
      predicted_speed: [Number],
      predicted_fuel_efficiency: [Number],
      risk_level: [Number] // Categorical: 0 = low, 1 = medium, 2 = high
    },
  
    recommendedStrategy: {
      type: Number,
      enum: [0, 1, 2] // Best choice based on logic/model
    },
  
    modelVersion: String, // Optional – helpful for tracking which model was used
    generatedAt: { type: Date, default: Date.now }
  });
  
module.exports = mongoose.model('StrategyRecommendation', strategyRecommendationSchema);
  