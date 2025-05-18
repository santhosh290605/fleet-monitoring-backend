const axios = require('axios');
const mongoose = require('mongoose');
const polyline = require('@mapbox/polyline');
const VehiclePath = require('../models/vehicle_path.model');
const Vehicle = require('../models/vehicle.model');

// Openrouteservice API endpoint and API key
const OPENROUTESERVICE_API_KEY = '5b3ce3597851110001cf6248a834b4a08ddd48ba8979f2b5a98051fe';
const OPENROUTESERVICE_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://santhosh2210429:9003203594@eventdatabase.u5mhw.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);  // Exit if MongoDB connection fails
  }
};

// Function to generate and store vehicle path
const generateAndStorePath = async (vehicleId, start, end) => {
  try {
    // Prepare request payload for Openrouteservice API
    const requestPayload = {
      coordinates: [start, end]
    };

    // Make the request to Openrouteservice API using axios
    const response = await axios.post(OPENROUTESERVICE_URL, requestPayload, {
      headers: {
        'Authorization': `Bearer ${OPENROUTESERVICE_API_KEY}`
      }
    });

    // Log the response to check if the coordinates exist
    console.log(`Openrouteservice Response for Vehicle ${vehicleId}:`, response.data);

    if (response.data.routes && response.data.routes.length > 0) {
      const routeGeometry = response.data.routes[0].geometry;

      // Decode the polyline geometry to coordinates
      const pathCoords = polyline.decode(routeGeometry).map(coord => ({
        latitude: coord[1],  // Flip latitude and longitude here
        longitude: coord[0]  // Flip latitude and longitude here
      }));

      // Log the first 5 decoded coordinates for debugging
      console.log(`🔍 First 5 decoded coords for vehicle ${vehicleId}:`, pathCoords.slice(0, 5));

      // Define Chennai bounds
      const isWithinChennai = (lat, lon) =>
        lat >= 12.7 && lat <= 13.2 && lon >= 80.0 && lon <= 80.35;

      // Filter the coordinates to ensure they are within Chennai bounds
      const filteredCoords = pathCoords.filter(point =>
        isWithinChennai(point.latitude, point.longitude)
      );

      // Log filtered coordinates
      console.log(`Filtered coordinates for vehicle ${vehicleId}:`, filteredCoords.length);

      if (filteredCoords.length === 0) {
        console.error(`❌ Vehicle ${vehicleId}: No valid Chennai coordinates found`);
        return;
      }

      // Create a document for the vehicle path
      const pathDoc = {
        vehicleId,
        path: filteredCoords,
        currentProgressIndex: 0,
        percentageCompleted: 0,
        totalDistance: response.data.routes[0].summary.distance / 1000, // Convert meters to kilometers
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save or update the vehicle path in MongoDB
      const updatedPath = await VehiclePath.findOneAndUpdate({ vehicleId }, pathDoc, { upsert: true, new: true });
      console.log(`✅ Path for vehicle ${vehicleId} saved/updated`);

      // Debugging: Log the path document for validation
      console.log(`Saved Path for vehicle ${vehicleId}:`, updatedPath);
    } else {
      console.error(`❌ No valid route data returned for vehicle ${vehicleId}`);
    }
  } catch (error) {
    console.error(`❌ Error generating path for vehicle ${vehicleId}:`, error.message);
  }
};

// Add a delay function to avoid rate-limiting issues
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Main execution function
(async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Fetch all vehicles from the database
    const vehicles = await Vehicle.find();
    console.log(`🚗 Found ${vehicles.length} vehicles`);

    // Define multiple start and end locations within Chennai (more realistic)
    const startPoints = [
      [80.2707, 13.0827], // Chennai central
      [80.2791, 13.0082], // East Chennai
      [80.2434, 13.0126], // South Chennai
      [80.2055, 13.0577], // West Chennai
      [80.2170, 13.0800]  // North Chennai
    ];

    const endPoints = [
      [80.2707, 13.0827], // Chennai central
      [80.2434, 13.0126], // South Chennai
      [80.2270, 13.0490], // Near Marina Beach
      [80.2122, 13.0293], // T. Nagar
      [80.3055, 13.0280]  // Near IT corridor
    ];

    // Generate and store path for each vehicle with a delay to prevent rate limiting
    for (const vehicle of vehicles) {
      try {
        // Randomly pick a start and end point for each vehicle to ensure distinct paths
        const start = startPoints[Math.floor(Math.random() * startPoints.length)];
        const end = endPoints[Math.floor(Math.random() * endPoints.length)];

        console.log(`🚙 Generating path for vehicle ${vehicle._id} from ${start} to ${end}`);

        await generateAndStorePath(vehicle._id, start, end);
        
        // Adding a small delay to avoid overwhelming the API
        await delay(2000); // Delay of 2 seconds between requests
      } catch (error) {
        console.error(`❌ Error processing vehicle ${vehicle._id}: ${error.message}`);
      }
    }

    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error in main execution:', error.message);
    mongoose.disconnect(); // Ensure MongoDB disconnects in case of error
  }
})();
