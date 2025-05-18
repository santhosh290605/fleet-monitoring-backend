const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, unique: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  licensePlate: { type: String, required: true },
  vin: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'maintenance', 'inactive'], default: 'active' },
  fuelType: { type: String },
  category: { type: String },
  assignedDriver: { type: String },
  deviceId: { type: String },
  unexpectedFailures: { type: Number, default: 0 } // Incremented on unscheduled issues
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
