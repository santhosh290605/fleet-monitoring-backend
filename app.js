const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const vehicleRoutes = require("./routes/vehicle.routes");
const telemetryRoutes = require('./routes/telemetry.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const strategyRoutes = require('./routes/strategy_recommendation.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const diagnosticsRoutes = require('./routes/diagnostics.routes');
const pathRoutes = require('./routes/vehicle_path.routes');
const rideBookingRoutes = require('./routes/ride_booking.routes');



const app = express();
connectDB()
app.use(express.json());
app.use(cors());

console.log("Cors enabled");

app.use("/api/vehicle", vehicleRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/dashboard',dashboardRoutes);
app.use('/api/diagnostics',diagnosticsRoutes);
app.use('/api/vehicle-path', pathRoutes);
app.use('/api/ride-booking',rideBookingRoutes);


module.exports = app;
