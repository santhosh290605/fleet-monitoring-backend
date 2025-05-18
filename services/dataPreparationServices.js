const Vehicle = require('../models/vehicle.model');
const Maintenance = require('../models/maintenance.model');
const Telemetry = require('../models/telemetry.model');
const dayjs = require('dayjs');

// Utility to clamp values within a range
const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

async function prepareModelInputData(vehicleId) {
  // 1. Get vehicle metadata
  const vehicle = await Vehicle.findOne({ _id: vehicleId });
  if (!vehicle) throw new Error('Vehicle not found');

  // 2. Get latest maintenance
  const latestMaintenance = await Maintenance.findOne({ vehicleId }).sort({ date: -1 });
  if (!latestMaintenance) throw new Error('No maintenance record found');

  const today = dayjs();
  const lastMaintenanceDate = dayjs(latestMaintenance.date);
  const daysSinceLastMaintenance = today.diff(lastMaintenanceDate, 'day');

  // 3. Optional: Estimate maintenance interval from previous two records
  const previousMaintenance = await Maintenance.find({ vehicleId }).sort({ date: -1 }).limit(2);
  let maintenanceInterval = 60; // fallback default
  if (previousMaintenance.length === 2) {
    const first = dayjs(previousMaintenance[0].date);
    const second = dayjs(previousMaintenance[1].date);
    maintenanceInterval = first.diff(second, 'day');
  }

  // 4. Optional: Get latest telemetry
  const latestTelemetry = await Telemetry.findOne({ vehicleId }).sort({ timestamp: -1 });

  // 5. Prepare normalized and clamped input features
  const inputFeatures = {
    days_since_last_maintenance: daysSinceLastMaintenance,
    maintenance_interval: maintenanceInterval,
    last_maintenance_cost: latestMaintenance.cost ?? 0,
    engine_health: clamp(
      latestMaintenance.engineHealth ?? latestTelemetry?.engineHealth ?? 85.0,
      0,
      100
    ),
    oil_quality: clamp(latestMaintenance.oilQuality ?? 70.0, 0, 100),
    tire_wear: clamp(latestMaintenance.tireWear ?? 20.0, 0, 100),
    vehicle_age: new Date().getFullYear() - vehicle.year,
    maintenance_quality_score: clamp(latestMaintenance.maintenanceQualityScore ?? 90.0, 0, 100),
    unexpected_failures: latestMaintenance.unexpectedFailures ?? 0,
  };

  return {
    inputFeatures,
    vehicle,
    latestMaintenance,
  };
}

module.exports = { prepareModelInputData };
