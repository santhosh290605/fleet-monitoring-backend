const VehicleData = require('../models/VehicleData');
const detectAnomalies = require("../services/anomalyDetection");
const calculateFutureImpact = require("../services/scenarioService");
const Vehicle = require('../models/vehicle.model');
const Telemetry = require('../models/telemetry.model');

const deleteVehicle = async (req, res) => {
    try {
      console.log("🗑️ Inside Delete Route");
      console.log("Vehicle ID:", req.params.id);
  
      const result = await Vehicle.findByIdAndDelete(req.params.id);
  
      console.log("Deleted Vehicle:", result);
  
      res.status(200).json({ message: "Vehicle deleted successfully!" });
    } catch (error) {
      console.error("❌ Error deleting vehicle:", error);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  };


const getTotalDistanceCovered = async (req, res) => {
    try {
      // Fetch all active vehicles
      const vehicles = await Vehicle.find({ status: "active" });
  
      // Fetch the latest telemetry for each vehicle and calculate the distance covered
      const distances = await Promise.all(
        vehicles.map(async (vehicle) => {
          const latestTelemetry = await Telemetry.findOne({ vehicleId: vehicle._id })
            .sort({ timestamp: -1 })  // Sort by latest timestamp
            .select("odometer");  // Only fetch the odometer field
  
          if (!latestTelemetry) return { vehicleId: vehicle._id, distance: 0 };
  
          return {
            vehicleId: vehicle._id,
            distance: latestTelemetry.odometer,
          };
        })
      );
  
      res.json(distances);  // Return the distances as response
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching vehicle distances" });
    }
  };
  
  





const getVehicleData = async (req, res) => {
    try {
        const data = await VehicleData.find({ vehicle_id: req.params.vehicleId })
            .sort({ timestamp: -1 })
            .limit(10);

        const anomalies = detectAnomalies(data);
        res.json({ data, anomalies });
    } catch (error) {
        res.status(500).json({ error: "Error fetching vehicle data" });
    }
};


const getScenarioPredictions = async (req, res) => {
    try {
        const { vehicleId, option } = req.params;

        const data = await VehicleData.find({ vehicle_id: vehicleId })
            .sort({ timestamp: -1 })
            .limit(5);

        if (!data.length) {
            return res.status(404).json({ message: "No data available for this vehicle." });
        }

        const predictions = calculateFutureImpact(data, option);
        res.json({ predictions });
    } catch (error) {
        res.status(500).json({ error: "Error generating predictions" });
    }
};


module.exports = {deleteVehicle ,getVehicleData,getScenarioPredictions , getTotalDistanceCovered};