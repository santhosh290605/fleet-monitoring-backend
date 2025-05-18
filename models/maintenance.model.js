const mongoose = require("mongoose");

// models/Maintenance.js

const maintenanceSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  date: Date,
  type: String,
  description: String,
  cost: Number,

  // ⬇️ Fleet Time Machine specific fields
  maintenanceInterval: Number,          // e.g., 60 days between services
  engineHealth: Number,                // 0–100
  oilQuality: Number,                  // 0–100
  tireWear: Number,                    // % worn
  maintenanceQualityScore: Number,    // 0–100

  // Derived field (optional) – store for performance
  daysSinceLastMaintenance: Number     // Calculated when added
});
  
module.exports = mongoose.model('Maintenance', maintenanceSchema);
  
