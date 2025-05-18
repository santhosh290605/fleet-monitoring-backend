require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('../models/vehicle.model');
const Telemetry = require('../models/telemetry.model');
const VehiclePath = require('../models/vehicle_path.model');

// MongoDB Connection
mongoose.connect('mongodb+srv://santhosh2210429:9003203594@eventdatabase.u5mhw.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once('open', async () => {
  console.log('✅ Connected to MongoDB. Starting telemetry simulation...');
  try {
    await initializeMovementPlans();
    setInterval(simulateTelemetry, 5000); // Run every 5 seconds
  } catch (err) {
    console.error('❌ Initialization error:', err);
    process.exit(1);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down simulator...');
  await mongoose.disconnect();
  process.exit(0);
});

// ========== Helpers ==========
const getRandomFloat = (min, max) => Math.random() * (max - min) + min;
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// In-memory movement tracker
const movementPlans = new Map();

// Step 1: Initialize
async function initializeMovementPlans() {
  const vehicles = await Vehicle.find();

  for (const vehicle of vehicles) {
    const pathData = await VehiclePath.findOne({ vehicleId: vehicle._id });

    if (pathData && pathData.path?.length >= 2) {
      movementPlans.set(vehicle._id.toString(), {
        path: pathData.path,
        currentProgressIndex: 0,
        isLooping: pathData.isLooping,
        totalDistance: pathData.totalDistance || calculateDistance(pathData.path),
      });
    }
  }
}

// Step 2: Simulate Telemetry
async function simulateTelemetry() {
  const vehicles = await Vehicle.find();
  if (vehicles.length === 0) return;

  for (const vehicle of vehicles) {
    const id = vehicle._id.toString();
    const plan = movementPlans.get(id);

    if (!plan || plan.path.length < 2) continue;

    const { path, isLooping, totalDistance } = plan;
    let { currentProgressIndex } = plan;

    // Skip inactive or maintenance vehicles
    if (vehicle.status === 'inactive' || vehicle.status === 'maintenance') {
      console.log(`Vehicle ${vehicle._id} is ${vehicle.status}, not moving.`);
      continue; // Skip this vehicle and don't simulate movement
    }

    // Teleport to the next point
    currentProgressIndex++;
    if (currentProgressIndex >= path.length) {
      if (isLooping) {
        currentProgressIndex = 0;
      } else {
        currentProgressIndex = path.length - 1;
      }
    }

    const currentLocation = path[currentProgressIndex];
    plan.currentProgressIndex = currentProgressIndex;

    // Update percentage completed
    const distanceCovered = calculateDistance(path.slice(0, currentProgressIndex + 1));
    const percentageCompleted = Math.min((distanceCovered / totalDistance) * 100, 100);

    // Update vehicle path document
    await VehiclePath.updateOne(
      { vehicleId: vehicle._id },
      {
        $set: {
          percentageCompleted: percentageCompleted,
          updatedAt: new Date(),
        },
      }
    );

    // Fetch last telemetry
    const lastTelemetry = await Telemetry.findOne({ vehicleId: vehicle._id }).sort({ timestamp: -1 });
    const fallbackFuel = getRandomFloat(40, 80);
    const fallbackOdo = 10000;

    const telemetryData = {
      vehicleId: vehicle._id,
      timestamp: new Date(),
      location: currentLocation,
      speed: vehicle.status === 'active' ? getRandomFloat(30, 90) : 0,

      fuelLevel: (() => {
        const prev = lastTelemetry?.fuelLevel ?? fallbackFuel;
        const val = prev - getRandomFloat(0.1, 0.5);
        return Math.min(Math.max(val, 10), 100); // Min 10%, Max 100%
      })(),
      
    
      engineStatus: vehicle.status === 'active' ? 'on' : 'off',
    
      batteryVoltage: (() => {
        const base = vehicle.status === 'active' ? getRandomFloat(12.5, 14) : 12;
        const val = base + getRandomFloat(-0.1, 0.1);
        return Math.min(Math.max(val, 0), 15);
      })(),
    
      odometer: Math.max((lastTelemetry?.odometer ?? fallbackOdo) + (vehicle.status === 'active' ? getRandomFloat(1, 3) : 0), 0),
    
      engineTemp: (() => {
        const base = vehicle.status === 'active' ? getRandomFloat(70, 100) : getRandomFloat(30, 50);
        const val = base + getRandomFloat(-3, 3);
        return Math.min(Math.max(val, 0), 120);
      })(),
    };
    

    telemetryData.engineTemp = Math.max(telemetryData.engineTemp + getRandomFloat(-3, 3), 0);
    telemetryData.batteryVoltage = Math.max(telemetryData.batteryVoltage + getRandomFloat(-0.1, 0.1), 0);


    await Telemetry.create(telemetryData);

    // Keep only the last 100 telemetry entries
    const recent = await Telemetry.find({ vehicleId: vehicle._id }).sort({ timestamp: -1 }).limit(100).select('_id');
    if (recent.length === 100) {
      await Telemetry.deleteMany({
        vehicleId: vehicle._id,
        _id: { $nin: recent.map(doc => doc._id) },
      });
    }

    // Delay between vehicles
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`🚀 Telemetry updated for ${vehicles.length} vehicles`);
}

// ========== Distance Calculation ==========
function calculateDistance(path) {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += getDistance(path[i], path[i + 1]);
  }
  return total;
}

function getDistance(point1, point2) {
  const R = 6371;
  const dLat = deg2rad(point2.latitude - point1.latitude);
  const dLon = deg2rad(point2.longitude - point1.longitude);
  const lat1 = deg2rad(point1.latitude);
  const lat2 = deg2rad(point2.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const deg2rad = (deg) => deg * (Math.PI / 180);
