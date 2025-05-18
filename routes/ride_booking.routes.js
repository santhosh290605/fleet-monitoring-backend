const express = require('express');
const router = express.Router();
const { simulateRideBooking } = require('../controllers/rideBookingController');

router.post('/simulate', simulateRideBooking);

module.exports = router;
