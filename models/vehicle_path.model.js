const mongoose = require('mongoose');

// Define the schema for vehicle paths
const vehiclePathSchema = new mongoose.Schema({
  vehicleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle', 
    required: true 
  },  // Link to the Vehicle collection
  
  fromDistrict: { 
    name: { type: String, required: true },
    city: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },  // Starting district with structured data
  
  toDistrict: { 
    name: { type: String, required: true },
    city: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },  // Ending district with structured data
  
  path: [
    {
      latitude: { 
        type: Number, 
        required: true 
      },
      longitude: { 
        type: Number, 
        required: true 
      }
    }
  ],  // Array of latitude/longitude pairs
  
  totalDistance: { 
    type: Number, 
    required: true 
  },  // Total distance of the path in km
  
  isLooping: { 
    type: Boolean, 
    default: true 
  },  // Whether the vehicle will loop back or ping-pong
  
  currentProgressIndex: { 
    type: Number, 
    default: 0 
  },  // Current index in the path array (helps track progress)
  
  percentageCompleted: { 
    type: Number, 
    default: 0 
  },  // Percentage of the path completed
  
  isActive: { 
    type: Boolean, 
    default: true 
  },  // Flag to indicate whether the path simulation is active
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },  // Timestamp for when the path was created
  
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }  // Timestamp for when the path was last updated
});

// Create and export the model
const VehiclePath = mongoose.model('VehiclePath', vehiclePathSchema);
module.exports = VehiclePath;
