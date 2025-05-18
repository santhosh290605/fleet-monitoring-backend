const generateAlertsForAllVehicles = require('../services/generateAlertsForAllVehicles');
const Alert = require('../models/alert.model');
const Vehicle = require('../models/vehicle.model');
const StrategyRecommendation = require('../models/strategy_recommendation.model');
const Maintenance = require('../models/maintenance.model')

exports.getActiveAlertCount = async (req, res) => {
  try {
    const count = await Alert.countDocuments({ resolved: false });
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active alert count', details: err.message });
  }
};

exports.getActiveAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ resolved: false }).sort({ timestamp: -1 });
    res.status(200).json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active alerts', details: err.message });
  }
};

exports.runDiagnostics = async (req, res) => {
  try {
    const alerts = await generateAlertsForAllVehicles('manual');
    res.status(200).json({
      message: 'Diagnostics run successfully.',
      totalAlerts: alerts.length,
      alerts
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to run diagnostics', details: err.message });
  }
};

exports.getAlertById = async (req, res) => {
  const { id } = req.params;

  try {
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    res.status(200).json(alert);
  } catch (err) {
    console.error('Error fetching alert:', err);
    res.status(500).json({ error: 'Server error while fetching alert' });
  }
};



exports.resolveAlert = async (req, res) => {
  const { id } = req.params;
  const { resolvedBy, resolutionNote } = req.body;

  if (!resolvedBy || typeof resolvedBy !== 'string') {
    return res.status(400).json({ error: 'ResolvedBy name is required and must be a string.' });
  }

  try {
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    if (alert.resolved) {
      return res.status(400).json({ error: 'Alert is already resolved.' });
    }

    // ✅ Mark the alert as resolved
    alert.resolved = true;
    alert.resolvedBy = resolvedBy;
    alert.resolutionNote = resolutionNote || '';
    alert.resolvedAt = new Date();
    await alert.save();

    // ✅ Handle each alertType
    switch (alert.alertType) {
      case 'High Risk Vehicle': {
        const strategy = await StrategyRecommendation.findOne({ vehicleId: alert.vehicleId })
          .sort({ generatedAt: -1 });

        if (strategy) {
          strategy.predictions.risk_level = strategy.predictions.risk_level.map(level =>
            level === 2 ? 1 : level
          );
          await strategy.save();
        }
        break;
      }

      case 'Unexpected Failures': {
        const vehicle = await Vehicle.findById(alert.vehicleId);
        if (vehicle && vehicle.unexpectedFailures > 0) {
          vehicle.unexpectedFailures -= 1;
          await vehicle.save();
        }
        break;
      }

      case 'Overdue Maintenance': {
        const latestMaintenance = await Maintenance.findOne({ vehicleId: alert.vehicleId })
          .sort({ date: -1 });
        if (latestMaintenance && resolutionNote) {
          latestMaintenance.description += `\n[Resolved Alert Note]: ${resolutionNote}`;
          await latestMaintenance.save();
        }
        break;
      }

      case 'Low Oil Quality': {
        if (alert.relatedMaintenanceId) {
          await Maintenance.findByIdAndUpdate(alert.relatedMaintenanceId, { oilQuality: 75 });
        }
        break;
      }

      case 'High Tire Wear': {
        if (alert.relatedMaintenanceId) {
          await Maintenance.findByIdAndUpdate(alert.relatedMaintenanceId, { tireWear: 50 });
        }
        break;
      }

      case 'Data Incomplete': {
        // Fix the most recent telemetry with missing fields by applying safe fallbacks
        const telemetry = await Telemetry.findOne({ vehicleId: alert.vehicleId })
          .sort({ timestamp: -1 });

        if (telemetry) {
          let modified = false;
          const fallbackFields = ['speed', 'fuelLevel', 'engineStatus', 'batteryVoltage', 'odometer', 'engineTemp'];

          fallbackFields.forEach(field => {
            if (telemetry[field] === null || telemetry[field] === undefined) {
              telemetry[field] = -1; // Placeholder to indicate imputed data
              modified = true;
            }
          });

          if (modified) {
            await telemetry.save();
          }
        }
        break;
      }
    }

    res.status(200).json({ message: 'Alert resolved successfully.', alert });
  } catch (err) {
    console.error('Error resolving alert:', err);
    res.status(500).json({ error: 'Server error while resolving alert' });
  }
};