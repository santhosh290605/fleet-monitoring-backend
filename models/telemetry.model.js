const mongoose = require("mongoose");


const telemetrySchema = new mongoose.Schema({
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    timestamp: { type: Date, default: Date.now },
    location: {
      latitude: Number,
      longitude: Number
    },
    speed: Number,
    fuelLevel: Number,
    engineStatus: String,
    batteryVoltage: Number,
    odometer: Number,
    engineTemp: Number
  });
  
module.exports = mongoose.model('Telemetry', telemetrySchema);
  