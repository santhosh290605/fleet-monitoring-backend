// controllers/dashboardController.js

const Vehicle = require('../models/vehicle.model');
const Maintenance = require('../models/maintenance.model');
const StrategyRecommendation = require('../models/strategy_recommendation.model');

exports.getTopCardsData = async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();

    const statusCounts = await Vehicle.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const statusMap = {
      active: 0,
      maintenance: 0,
      inactive: 0
    };

    statusCounts.forEach(stat => {
      statusMap[stat._id] = stat.count;
    });

    const vehiclesWithFailures = await Vehicle.countDocuments({ unexpectedFailures: { $gt: 0 } });

    const latestMaintenances = await Maintenance.aggregate([
      {
        $sort: { date: -1 }
      },
      {
        $group: {
          _id: "$vehicleId",
          latestEngineHealth: { $first: "$engineHealth" }
        }
      }
    ]);

    const averageEngineHealth =
      latestMaintenances.length > 0
        ? latestMaintenances.reduce((sum, m) => sum + m.latestEngineHealth, 0) /
          latestMaintenances.length
        : 0;


    const criticallyAtRisk = await StrategyRecommendation.distinct("vehicleId", {
      "predictions.risk_level": { $all: [2, 2, 2] },
    });
    const criticalCount = criticallyAtRisk.length;
        

    res.json({
      totalVehicles,
      activeVehicles: statusMap.active,
      maintenanceVehicles: statusMap.maintenance,
      inactiveVehicles: statusMap.inactive,
      vehiclesWithFailures,
      averageEngineHealth: averageEngineHealth.toFixed(2),
      criticalCount
    });
  } catch (err) {
    console.error("Top Cards Fetch Error:", err);
    res.status(500).json({ message: "Error fetching top card data" });
  }
};


exports.getStrategyOverview = async (req, res) => {
  try {
    const allRecommendations = await StrategyRecommendation.find();

    // Count per recommended strategy
    const strategyCount = { delayed: 0, immediate: 0, scheduled: 0 };
    const strategyIndexMap = { 0: 'delayed', 1: 'immediate', 2: 'scheduled' };

    // Aggregate sums for averages
    const metricSums = {
      delayed: { cost: 0, speed: 0, fuel: 0, count: 0 },
      immediate: { cost: 0, speed: 0, fuel: 0, count: 0 },
      scheduled: { cost: 0, speed: 0, fuel: 0, count: 0 },
    };

    allRecommendations.forEach(rec => {
      const { predictions, recommendedStrategy } = rec;
      const strategy = strategyIndexMap[recommendedStrategy];

      strategyCount[strategy] += 1;

      metricSums[strategy].cost += predictions.predicted_maintenance_cost[recommendedStrategy];
      metricSums[strategy].speed += predictions.predicted_speed[recommendedStrategy];
      metricSums[strategy].fuel += predictions.predicted_fuel_efficiency[recommendedStrategy];
      metricSums[strategy].count += 1;
    });

    const avg = (sum, count) => (count > 0 ? (sum / count).toFixed(2) : 0);

    res.json({
      strategyDistribution: strategyCount,
      strategyAverages: {
        delayed: {
          avgCost: avg(metricSums.delayed.cost, metricSums.delayed.count),
          avgSpeed: avg(metricSums.delayed.speed, metricSums.delayed.count),
          avgFuel: avg(metricSums.delayed.fuel, metricSums.delayed.count),
        },
        immediate: {
          avgCost: avg(metricSums.immediate.cost, metricSums.immediate.count),
          avgSpeed: avg(metricSums.immediate.speed, metricSums.immediate.count),
          avgFuel: avg(metricSums.immediate.fuel, metricSums.immediate.count),
        },
        scheduled: {
          avgCost: avg(metricSums.scheduled.cost, metricSums.scheduled.count),
          avgSpeed: avg(metricSums.scheduled.speed, metricSums.scheduled.count),
          avgFuel: avg(metricSums.scheduled.fuel, metricSums.scheduled.count),
        }
      }
    });
  } catch (err) {
    console.error("Strategy overview fetch error:", err);
    res.status(500).json({ message: "Error fetching strategy insights" });
  }
};