const mongoose = require('mongoose');

const Maintenance = require('../models/maintenance.model');


const { generateStrategyRecommendation } = require('../services/strategyService'); // Adjust path as needed

// GET maintenance records for a specific vehicle
const getMaintenanceRecords = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const maintenanceRecords = await Maintenance.find({ vehicleId });
    res.status(200).json(maintenanceRecords);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching maintenance records' });
  }
};


const addMaintenance = async (req, res) => {
  const { id: vehicleId } = req.params;

  try {
    // Step 1: Get the latest maintenance entry
    const latestRecord = await Maintenance.findOne({ vehicleId }).sort({ date: -1 });

    let daysSinceLastMaintenance = null;
    if (latestRecord?.date) {
      const lastDate = new Date(latestRecord.date);
      const currentDate = new Date(req.body.date || Date.now());
      const diffInMs = Math.abs(currentDate - lastDate);
      daysSinceLastMaintenance = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    }

    // Step 2: Sanitize and set fallback fields
    const {
      type = 'General Maintenance',
      description = 'Routine check',
      cost = 0,
      date,
      maintenanceInterval = 60,
      engineHealth = 80,
      oilQuality = 75,
      tireWear = 20,
      maintenanceQualityScore = 85
    } = req.body;

    // Step 3: Ensure valid date and create the new record
    const maintenanceDate = date ? new Date(date) : new Date();

    // Step 4: Create and save new maintenance record
    const newRecord = new Maintenance({
      vehicleId,  // vehicleId is already ObjectId, no need to create a new one
      type,
      description,
      cost,
      date: maintenanceDate,
      maintenanceInterval,
      engineHealth,
      oilQuality,
      tireWear,
      maintenanceQualityScore,
      daysSinceLastMaintenance
    });

    console.log('📦 Saving new maintenance:', newRecord);
    await newRecord.save();  // Ensure this completes before proceeding
    console.log('✅ Maintenance record saved.');

    // Step 5: Trigger strategy recommendation after saving maintenance record
    try {
      // Trigger the recommendation generation asynchronously
      const recommendation = await generateStrategyRecommendation(vehicleId);
      console.log('✅ Strategy recommendation generated:', recommendation?._id || 'Success');
    } catch (err) {
      // Log strategy recommendation error, but do not block the response
      console.error('⚠️ Strategy recommendation generation failed:', err.message);
    }

    // Step 6: Send a successful response after maintenance is saved
    res.status(201).json({ message: 'Maintenance record added successfully.' });

  } catch (error) {
    console.error('❌ Error adding maintenance record:', error);
    res.status(500).json({ error: 'Error adding maintenance record', details: error.message });
  }
};

module.exports = { getMaintenanceRecords, addMaintenance };
