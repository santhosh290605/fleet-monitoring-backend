const Alert = require('../models/alert.model');
const StrategyRecommendation = require('../models/strategy_recommendation.model');
const Maintenance = require('../models/maintenance.model');
const Telemetry = require('../models/telemetry.model');

// Configurable thresholds
const thresholds = {
  oilQuality: 30, // < %
  tireWear: 70,   // > %
  unexpectedFailures: 3,
  overdueDaysBuffer: 5 // Grace period beyond maintenanceInterval
};

async function generateAlertsForVehicle(vehicle, triggeredBy = 'system') {
  const vehicleId = vehicle._id;
  const alerts = [];

  // Step 1: Get latest data in parallel
  const [latestMaintenance, latestStrategy, latestTelemetry] = await Promise.all([
    Maintenance.findOne({ vehicleId }).sort({ date: -1 }),
    StrategyRecommendation.findOne({ vehicleId }).sort({ generatedAt: -1 }),
    Telemetry.findOne({ vehicleId }).sort({ timestamp: -1 })
  ]);

  // Step 2: Edge Case – Incomplete Data
  if (!latestMaintenance || !latestStrategy || !latestTelemetry) {
    const infoAlert = await Alert.create({
      vehicleId,
      alertType: 'Data Incomplete',
      severity: 'info',
      message: 'Vehicle does not have sufficient data (maintenance, telemetry, or strategy) for alert monitoring.',
      triggeredBy,
      resolved: false
    });
    return [infoAlert];
  }

  // Step 3: High Risk Vehicle from Strategy
  const riskLevel = latestStrategy?.predictions?.risk_level?.[latestStrategy.recommendedStrategy];
  if (riskLevel === 2) {
    alerts.push({
      alertType: 'High Risk Vehicle',
      severity: 'critical',
      message: 'Vehicle marked as high risk in latest recommendation.',
      relatedStrategyId: latestStrategy._id
    });
  }

  // Step 4: Unexpected Failures
  if (typeof vehicle.unexpectedFailures === 'number' && vehicle.unexpectedFailures >= thresholds.unexpectedFailures) {
    alerts.push({
      alertType: 'Unexpected Failures',
      severity: 'warning',
      message: `Vehicle has ${vehicle.unexpectedFailures} unexpected failures.`
    });
  }

  // Step 5: Low Oil Quality
  if (typeof latestMaintenance.oilQuality === 'number' && latestMaintenance.oilQuality < thresholds.oilQuality) {
    alerts.push({
      alertType: 'Low Oil Quality',
      severity: 'warning',
      message: `Oil quality is low (${latestMaintenance.oilQuality}%).`,
      relatedMaintenanceId: latestMaintenance._id
    });
  }

  // Step 6: High Tire Wear
  if (typeof latestMaintenance.tireWear === 'number' && latestMaintenance.tireWear > thresholds.tireWear) {
    alerts.push({
      alertType: 'High Tire Wear',
      severity: 'warning',
      message: `Tire wear is high (${latestMaintenance.tireWear}%).`,
      relatedMaintenanceId: latestMaintenance._id
    });
  }

  // Step 7: Overdue Maintenance
  const { daysSinceLastMaintenance, maintenanceInterval } = latestMaintenance;
  if (
    typeof daysSinceLastMaintenance === 'number' &&
    typeof maintenanceInterval === 'number' &&
    daysSinceLastMaintenance > (maintenanceInterval + thresholds.overdueDaysBuffer)
  ) {
    alerts.push({
      alertType: 'Overdue Maintenance',
      severity: 'critical',
      message: `Maintenance is overdue by ${daysSinceLastMaintenance - maintenanceInterval} days.`,
      relatedMaintenanceId: latestMaintenance._id
    });
  }

  // Step 8: Persist all alerts
  const savedAlerts = await Promise.all(
    alerts.map(data =>
      Alert.create({
        ...data,
        vehicleId,
        triggeredBy,
        resolved: false
      })
    )
  );

  return savedAlerts;
}

module.exports = generateAlertsForVehicle;
