require('dotenv').config();
const mongoose = require('mongoose');
const StrategyRecommendation = require('./models/strategy_recommendation.model');
const Maintenance = require('./models/maintenance.model');

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://santhosh2210429:9003203594@eventdatabase.u5mhw.mongodb.net/')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const vehicles = [
  { id: '67d5a703b58892c14730aed3' },
  { id: '67d5a703b58892c14730aed2' },
  { id: '67d5a703b58892c14730aed4' }
];

const inputVariants = [
  {
    inputFeatures: {
      daysSinceLastMaintenance: 30,
      maintenanceInterval: 60,
      lastMaintenanceCost: 3500,
      engineHealth: 90,
      oilQuality: 85,
      tireWear: 15,
      vehicleAge: 2,
      maintenanceQualityScore: 88,
      unexpectedFailures: 1
    },
    predictions: {
      predicted_maintenance_cost: [7000, 5000, 5200],
      predicted_speed: [80, 78, 79],
      predicted_fuel_efficiency: [12.5, 14.0, 13.0],
      risk_level: [2, 0, 1]
    },
    recommendedStrategy: 1
  },
  {
    inputFeatures: {
      daysSinceLastMaintenance: 70,
      maintenanceInterval: 60,
      lastMaintenanceCost: 5500,
      engineHealth: 60,
      oilQuality: 45,
      tireWear: 40,
      vehicleAge: 5,
      maintenanceQualityScore: 65,
      unexpectedFailures: 4
    },
    predictions: {
      predicted_maintenance_cost: [6000, 7500, 5000],
      predicted_speed: [60, 55, 62],
      predicted_fuel_efficiency: [10, 8, 11],
      risk_level: [1, 2, 0]
    },
    recommendedStrategy: 2
  },
  {
    inputFeatures: {
      daysSinceLastMaintenance: 90,
      maintenanceInterval: 75,
      lastMaintenanceCost: 8000,
      engineHealth: 45,
      oilQuality: 35,
      tireWear: 60,
      vehicleAge: 6,
      maintenanceQualityScore: 50,
      unexpectedFailures: 6
    },
    predictions: {
      predicted_maintenance_cost: [9000, 9500, 7800],
      predicted_speed: [50, 48, 52],
      predicted_fuel_efficiency: [7.5, 6, 8],
      risk_level: [2, 2, 1]
    },
    recommendedStrategy: 0
  }
];

const seedRecommendations = async () => {
  try {
    for (let i = 0; i < vehicles.length; i++) {
      const vehicle = vehicles[i];
      const vehicleId = new mongoose.Types.ObjectId(vehicle.id);

      const maintenanceRecord = await Maintenance.findOne({ vehicleId }).sort({ date: -1 });

      if (!maintenanceRecord) {
        console.warn(`⚠️ No maintenance record found for vehicle ${vehicle.id}, skipping...`);
        continue;
      }

      const variant = inputVariants[i % inputVariants.length];

      const recommendation = new StrategyRecommendation({
        vehicleId,
        latestMaintenanceId: maintenanceRecord._id,
        inputFeatures: variant.inputFeatures,
        predictions: variant.predictions,
        recommendedStrategy: variant.recommendedStrategy,
        modelVersion: 'v1.0'
      });

      await recommendation.save();
      console.log(`✅ StrategyRecommendation saved for vehicle ${vehicle.id}`);
    }
  } catch (err) {
    console.error('❌ Error seeding strategy recommendations:', err);
  } finally {
    mongoose.connection.close();
  }
};

seedRecommendations();
