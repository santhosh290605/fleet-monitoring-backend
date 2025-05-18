const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },

  alertType: {
    type: String,
    enum: [
      'High Risk Vehicle',
      'Unexpected Failures',
      'Low Oil Quality',
      'High Tire Wear',
      'Overdue Maintenance',
      'Data Incomplete'
    ],
    required: true
  },

  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    required: true
  },

  message: {
    type: String,
    required: true
  },

  // ✅ Lifecycle fields
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: String,
    default: null
  },
  resolutionNote: {
    type: String,
    default: ''
  },

  // ✅ Metadata for better traceability
  triggeredBy: {
    type: String,
    enum: ['system', 'manual', 'scheduled-scan'],
    default: 'system'
  },
  relatedMaintenanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maintenance',
    default: null
  },
  relatedStrategyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StrategyRecommendation',
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Alert', alertSchema);

