const mongoose = require('mongoose');
const Telemetry = require('../models/telemetry.model');
const Vehicle = require('../models/vehicle.model');

// GET telemetry data for a specific vehicle
const getVehicleTelemetry = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    // Convert to ObjectId if needed
    const vehicleObjectId = new mongoose.Types.ObjectId(vehicleId);

    const telemetryData = await Telemetry.find({ vehicleId: vehicleObjectId }).sort({ timestamp: -1 });
    res.status(200).json(telemetryData);
  } catch (err) {
    console.error("❌ Error fetching telemetry for vehicle:", err.message);
    res.status(500).json({ error: 'Error fetching telemetry data' });
  }
};

// ADD new telemetry data
const addTelemetry = async (req, res) => {
  try {
    const { vehicleId, location, speed, fuelLevel, engineStatus, batteryVoltage, odometer, engineTemp, timestamp } = req.body;

    if (!vehicleId || !timestamp || !location || speed == null || fuelLevel == null || !engineStatus || batteryVoltage == null || odometer == null || engineTemp == null) {
      return res.status(400).json({ error: "Missing required telemetry fields" });
    }

    const newTelemetry = new Telemetry({
      vehicleId: new mongoose.Types.ObjectId(vehicleId),
      location,
      speed,
      fuelLevel,
      engineStatus,
      batteryVoltage,
      odometer,
      engineTemp,
      timestamp: new Date(timestamp)
    });

    await newTelemetry.save();
    res.status(201).json(newTelemetry);
  } catch (err) {
    console.error("❌ Error adding telemetry data:", err.message);
    res.status(500).json({ error: 'Error adding telemetry data' });
  }
};



const getLatestTelemetry = async (req, res) => {
  try {
    console.log('📡 Fetching latest telemetry data...');

    // Step 1: Aggregate latest telemetry records per vehicleId
    const telemetry = await Telemetry.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$vehicleId",
          doc: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$doc" } },

      // Step 2: Ensure vehicleId is a valid ObjectId
      {
        $addFields: {
          vehicleIdType: { $type: "$vehicleId" }
        }
      },
      {
        $match: {
          vehicleIdType: "objectId"
        }
      },

      // Step 3: Perform the join with vehicles collection
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicleId",
          foreignField: "_id",
          as: "vehicle"
        }
      },
      {
        $unwind: {
          path: "$vehicle",
          preserveNullAndEmptyArrays: true
        }
      },

      // Step 4: Clean and return the final shape
      {
        $project: {
          _id: 0,
          vehicleId: 1,
          location: 1,
          speed: 1,
          fuelLevel: 1,
          odometer: 1,
          engineStatus: 1,
          batteryVoltage: 1,
          engineTemp: 1,
          timestamp: 1,
          vehicle: {
            make: "$vehicle.make",
            model: "$vehicle.model",
            status: "$vehicle.status"
          }
        }
      }
    ]);

    console.log(`✅ Retrieved ${telemetry.length} telemetry records`);
    res.status(200).json(telemetry);

  } catch (err) {
    console.error("❌ Error fetching telemetry for vehicle:");
    console.error(err.message);
    console.error(err.stack);
    res.status(500).json({ error: 'Error fetching telemetry data' });
  }
};



module.exports = {
  getVehicleTelemetry,
  addTelemetry,
  getLatestTelemetry
};
