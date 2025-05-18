const axios = require('axios');
const polyline = require('@mapbox/polyline');
const VehiclePath = require('../models/vehicle_path.model');

const OPENROUTESERVICE_API_KEY = '5b3ce3597851110001cf6248a834b4a08ddd48ba8979f2b5a98051fe';
const OPENROUTESERVICE_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

const generateAndStorePath = async (vehicleId, start, end, fromPlace, toPlace) => {
  try {
    const requestPayload = { coordinates: [start, end] };
    const response = await axios.post(OPENROUTESERVICE_URL, requestPayload, {
      headers: {
        'Authorization': `Bearer ${OPENROUTESERVICE_API_KEY}`
      }
    });

    if (response.data.routes?.length) {
      const routeGeometry = response.data.routes[0].geometry;
      const pathCoords = polyline.decode(routeGeometry).map(coord => ({
        latitude: coord[0],
        longitude: coord[1]
      }));

      const isWithinChennai = (lat, lon) =>
        lat >= 12.7 && lat <= 13.2 && lon >= 80.0 && lon <= 80.35;

      const filteredCoords = pathCoords.filter(point =>
        isWithinChennai(point.latitude, point.longitude)
      );

      if (filteredCoords.length === 0) {
        console.error(`❌ No valid Chennai coordinates for vehicle ${vehicleId}`);
        return null;
      }

      const pathDoc = {
        vehicleId,
        fromDistrict: {
          name: fromPlace.name,
          city: fromPlace.city,
          latitude: fromPlace.latitude,
          longitude: fromPlace.longitude
        },
        toDistrict: {
          name: toPlace.name,
          city: toPlace.city,
          latitude: toPlace.latitude,
          longitude: toPlace.longitude
        },
        path: filteredCoords,
        currentProgressIndex: 0,
        percentageCompleted: 0,
        totalDistance: response.data.routes[0].summary.distance / 1000, // in km
        isLooping: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedPath = await VehiclePath.findOneAndUpdate({ vehicleId }, pathDoc, { upsert: true, new: true });
      return updatedPath;
    }

    console.error(`❌ No valid route data for vehicle ${vehicleId}`);
    return null;
  } catch (error) {
    console.error(`❌ Error generating path for vehicle ${vehicleId}:`, error.message);
    return null;
  }
};

module.exports = { generateAndStorePath };
