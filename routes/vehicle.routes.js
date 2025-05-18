const express = require('express');
const Vehicle = require('../models/vehicle.model');
const router = express.Router();
const {deleteVehicle,getScenarioPredictions,getVehicleData,getTotalDistanceCovered} = require('../controllers/vehicleController')
const Telemetry = require('../models/telemetry.model');
const Maintenance = require('../models/maintenance.model');
const axios = require('axios');


router.get("/:vehicleId/scenario/:option", getScenarioPredictions);

router.get("/vehicles/distance", getTotalDistanceCovered);



//Add a new vehicle
router.post('/add', async (req, res) => {
  try {
    // Step 1: Create the vehicle from the request body
    const newVehicle = new Vehicle(req.body);
    await newVehicle.save();

    // Step 2: Create the telemetry record for the new vehicle
    const newTelemetry = new Telemetry({
      vehicleId: newVehicle._id,
      location: { latitude: 0, longitude: 0 },  // Placeholder values
      speed: 0,
      fuelLevel: 100,  // Assume full tank initially
      engineStatus: 'idle',  // Default engine status
      batteryVoltage: 12.5,  // Placeholder battery voltage
      odometer: 0,  // Placeholder odometer reading
      engineTemp: 25,  // Placeholder engine temperature
      timestamp: new Date()
    });

    await newTelemetry.save();

    // Step 3: Call the addMaintenance route to create a maintenance record for the new vehicle
    const maintenanceData = {
      vehicleId: newVehicle._id,
      type: 'Initial Check',  // Default maintenance type
      description: 'Initial vehicle check and setup.',
      cost: 300,  // Placeholder cost
      date: new Date(),  // Set the current date as the maintenance date
      maintenanceInterval: 60,  // Assume 60 days between services
      engineHealth: 100,  // Assume perfect engine health initially
      oilQuality: 100,  // Assume perfect oil quality initially
      tireWear: 45,  // Assume no tire wear initially
      maintenanceQualityScore: 90,  // Assume perfect score
      daysSinceLastMaintenance: 0  // Since this is the first maintenance, it's 0
    };

    // Trigger the addMaintenance route to create the maintenance record
    const addMaintenanceResponse = await axios.post(
      `http://localhost:3000/api/maintenance/${newVehicle._id}/add`, 
      maintenanceData
    );

    if (addMaintenanceResponse.status !== 201) {
      throw new Error('❌ Failed to add maintenance record');
    }

    // Step 4: Return the created vehicle along with its related telemetry and maintenance records
    res.status(201).json({
      vehicle: newVehicle,
      telemetry: newTelemetry,
      maintenance: addMaintenanceResponse.data  // Assuming response contains maintenance data
    });
  } catch (error) {
    console.error('Error adding vehicle and related records:', error);
    res.status(400).json({ message: error.message });
  }
});



// Fetch all vehicles
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', deleteVehicle);


router.get("/:vehicleId", getVehicleData);


router.get('/single/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.status(200).json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Returns the updated document
    );

    if (!updatedVehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.status(200).json(updatedVehicle);
  } catch (err) {
    console.error('Error updating vehicle status:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
