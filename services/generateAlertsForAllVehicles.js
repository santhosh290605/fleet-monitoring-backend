const Vehicle = require('../models/vehicle.model');
const Alert = require('../models/alert.model');
const generateAlertsForVehicle = require('./generateAlertsForVehicle');

/**
 * Runs diagnostics on all vehicles and generates new alerts.
 * Optionally preserves historical alerts by not wiping them.
 */
async function generateAlertsForAllVehicles(triggeredBy = 'system') {
  try {
    const vehicles = await Vehicle.find();

    if (vehicles.length === 0) {
      console.log('🚫 No vehicles found in the database.');
      return [];
    }

    const allAlerts = [];

    for (const vehicle of vehicles) {
      // ❗ Optionally clear only unresolved alerts for clean diagnostics
      await Alert.deleteMany({ vehicleId: vehicle._id, resolved: false });

      // Generate new alerts with context
      const alerts = await generateAlertsForVehicle(vehicle, triggeredBy);
      allAlerts.push(...alerts);
    }

    console.log(`✅ Alert generation complete: ${allAlerts.length} alerts created.`);
    return allAlerts;

  } catch (error) {
    console.error('❌ Error generating alerts for all vehicles:', error);
    throw error;
  }
}

module.exports = generateAlertsForAllVehicles;
