
const mongoose = require('mongoose');
const Vehicle = require('./models/vehicle.model');
const Maintenance = require('./models/maintenance.model');
require('dotenv').config();

async function patchData() {
  await mongoose.connect('mongodb+srv://santhosh2210429:9003203594@eventdatabase.u5mhw.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

  await Vehicle.updateMany({}, {
    $set: {
      vehicleAge: 5,
      unexpectedFailures: 0
    }
  });

  await Maintenance.updateMany({}, {
    $set: {
      daysSinceLastMaintenance: 30,
      maintenanceInterval: 60,
      lastMaintenanceCost: 5000,
      engineHealth: 85.0,
      oilQuality: 70.0,
      tireWear: 20.0,
      maintenanceQualityScore: 90.0
    }
  });

  console.log('✅ Default values patched.');
  mongoose.connection.close();
}

patchData();
