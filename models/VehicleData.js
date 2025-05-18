const mongoose = require("mongoose");

const VehicleDataSchema = new mongoose.Schema({
    vehicle_id: String,
    timestamp: Date,
    speed: Number,
    engine_rpm: Number,
    throttle_position: Number,
    engine_load: Number,
    fuel_level: Number
}, { collection: "vehicledata" });

module.exports = mongoose.model("vehicledata", VehicleDataSchema);


