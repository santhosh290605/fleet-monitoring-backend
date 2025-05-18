const Vehicle = require('../models/vehicle.model');
const VehiclePath = require('../models/vehicle_path.model');
const { generateAndStorePath } = require('../services/pathGenerator');

const simulateRideBooking = async (req, res) => {
  try {
    const { start, end, fromPlace, toPlace } = req.body;

    // Log the incoming request body
    console.log('Incoming Request Body:', req.body);

    // Ensure the coordinates are in the correct order: [longitude, latitude]
    if (!start || !end || start.length !== 2 || end.length !== 2) {
      return res.status(400).json({ message: 'Invalid coordinates format' });
    }

    const flippedStart = [start[1], start[0]]; // Flip start coordinates
    const flippedEnd = [end[1], end[0]]; // Flip end coordinates

    // Log the flipped coordinates to verify they're correct
    console.log('Flipped Start:', flippedStart);
    console.log('Flipped End:', flippedEnd);

    const availableVehicles = await Vehicle.find({ status: { $in: ['inactive', 'maintenance'] } });

    // Log the available vehicles to check if any are returned
    console.log('Available vehicles:', availableVehicles);

    if (!availableVehicles.length) {
      return res.status(404).json({ message: 'No available vehicles found' });
    }

    const selectedVehicle = availableVehicles[Math.floor(Math.random() * availableVehicles.length)];
    console.log('Selected vehicle:', selectedVehicle);

    await VehiclePath.deleteOne({ vehicleId: selectedVehicle._id });

    const newPath = await generateAndStorePath(
      selectedVehicle._id,
      flippedStart,
      flippedEnd,
      fromPlace,
      toPlace
    );
    console.log('Generated path:', newPath);

    if (!newPath) {
      return res.status(500).json({ message: 'Path generation failed' });
    }

    await Vehicle.findByIdAndUpdate(selectedVehicle._id, { status: 'active' });

    res.status(200).json({
      message: 'Ride simulated successfully',
      vehicle: selectedVehicle,
      path: newPath
    });
  } catch (err) {
    console.error('❌ Ride simulation error:', err);
    res.status(500).json({ message: 'Ride simulation failed', error: err.message });
  }
};


module.exports = { simulateRideBooking };
