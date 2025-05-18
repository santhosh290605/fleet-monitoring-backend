const VehiclePath = require('../models/vehicle_path.model');
const { generateAndStorePath } = require('../services/pathGenerator');

// @desc    Get vehicle path by vehicleId
// @route   GET /api/vehicle-path/:vehicleId
// @access  Public
const getVehiclePathByVehicleId = async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const vehiclePath = await VehiclePath.findOne({ vehicleId });

    if (!vehiclePath) {
      return res.status(404).json({ error: 'Vehicle path not found' });
    }

    res.status(200).json({
      vehicleId,
      path: vehiclePath.path,
      fromDistrict: vehiclePath.fromDistrict,
      toDistrict: vehiclePath.toDistrict,
      totalDistance: vehiclePath.totalDistance,
    });
  } catch (error) {
    console.error('❌ Error fetching vehicle path:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



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

// Controller to generate a path for a specific vehicle
const createPathForVehicle = async (req, res) => {
  const { vehicleId } = req.params;

  // Define the fromPlace and toPlace for the path
  const fromPlace = {
    name: "Chennai Central",
    city: "Chennai",
    latitude: 13.0827,
    longitude: 80.2707
  };

  const toPlace = {
    name: "IT Corridor",
    city: "Chennai",
    latitude: 13.0280,
    longitude: 80.3055
  };

  try {
    // Randomly pick a start and end point for the vehicle
    const start = startPoints[Math.floor(Math.random() * startPoints.length)];
    const end = endPoints[Math.floor(Math.random() * endPoints.length)];

    // Call the function to generate and store the path
    const result = await generateAndStorePath(vehicleId, start, end, fromPlace, toPlace);

    if (result) {
      // Path generated successfully
      res.status(200).json({ message: '✅ Path generated successfully', path: result });
    } else {
      // Failed to generate the path
      res.status(400).json({ message: '❌ Failed to generate path' });
    }
  } catch (error) {
    // Catch any errors and send the error message
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};


module.exports = {
  getVehiclePathByVehicleId,
  createPathForVehicle
};
