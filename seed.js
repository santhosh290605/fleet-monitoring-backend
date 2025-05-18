const mongoose = require('mongoose');
const VehiclePath = require('./models/vehicle_path.model');
const Vehicle = require('./models/vehicle.model');

// Haversine distance calculation
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Key points in Chennai
const chennaiPoints = [
  { name: "Chennai Central", lat: 13.0827, lon: 80.2707 },
  { name: "T. Nagar", lat: 13.0418, lon: 80.2337 },
  { name: "Guindy", lat: 13.0068, lon: 80.2206 },
  { name: "Adyar", lat: 13.0066, lon: 80.2570 },
  { name: "Velachery", lat: 12.9760, lon: 80.2212 },
  { name: "Anna Nagar", lat: 13.0878, lon: 80.2073 },
  { name: "Mylapore", lat: 13.0339, lon: 80.2696 },
  { name: "Thiruvanmiyur", lat: 12.9843, lon: 80.2590 },
  { name: "Perambur", lat: 13.1200, lon: 80.2330 },
  { name: "Tambaram", lat: 12.9246, lon: 80.1218 }
];

// Linear interpolation between two points
const interpolateCoordinates = (from, to, numPoints) => {
  const latStep = (to.lat - from.lat) / (numPoints - 1);
  const lonStep = (to.lon - from.lon) / (numPoints - 1);
  const path = [];

  for (let i = 0; i < numPoints; i++) {
    path.push({
      latitude: parseFloat((from.lat + i * latStep).toFixed(6)),
      longitude: parseFloat((from.lon + i * lonStep).toFixed(6)),
    });
  }

  return path;
};

const seedVehiclePaths = async () => {
  try {
    await mongoose.connect('mongodb+srv://santhosh2210429:9003203594@eventdatabase.u5mhw.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    await VehiclePath.deleteMany({});
    console.log('🗑️ Cleared existing vehicle paths');

    const vehicles = await Vehicle.find();
    if (vehicles.length === 0) {
      console.log('⚠️ No vehicles found. Seed vehicle data first.');
      return;
    }

    for (const vehicle of vehicles) {
      let fromIndex = Math.floor(Math.random() * chennaiPoints.length);
      let toIndex;
      do {
        toIndex = Math.floor(Math.random() * chennaiPoints.length);
      } while (toIndex === fromIndex);

      const from = chennaiPoints[fromIndex];
      const to = chennaiPoints[toIndex];

      const path = interpolateCoordinates(from, to, 15);
      let totalDistance = 0;

      for (let i = 0; i < path.length - 1; i++) {
        totalDistance += haversineDistance(
          path[i].latitude, path[i].longitude,
          path[i + 1].latitude, path[i + 1].longitude
        );
      }

      const vehiclePath = new VehiclePath({
        vehicleId: vehicle._id,
        fromDistrict: {
          name: from.name,
          city: "Chennai",
          latitude: from.lat,
          longitude: from.lon,
        },
        toDistrict: {
          name: to.name,
          city: "Chennai",
          latitude: to.lat,
          longitude: to.lon,
        },
        path: path,
        totalDistance: parseFloat(totalDistance.toFixed(3)),
        isLooping: true,
        currentProgressIndex: 0,
        percentageCompleted: 0,
        updatedAt: new Date(),
      });

      await vehiclePath.save();
      console.log(`🚗 Vehicle ${vehicle.vehicleId} seeded from ${from.name} to ${to.name}`);
    }

    console.log('✅ All vehicle paths seeded successfully!');
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    mongoose.disconnect();
  }
};

seedVehiclePaths();
