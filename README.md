🚘 Fleet Monitoring System – Backend

This is the backend module of the Fleet Monitoring System.
It powers the APIs, database, telemetry simulation, and ML-driven predictive maintenance for the project.

⚡ Note: This repository contains only the backend services. The frontend dashboard and mobile driver app run separately.

📌 Features

⚙️ REST APIs – For vehicles, telemetry, maintenance, and ride booking.

🛢 MongoDB Database – Stores vehicle details, telemetry, maintenance history, and paths.

🤖 Machine Learning Integration – Predictive maintenance, risk analysis, and fuel efficiency predictions.

🚦 Telemetry Simulation – Vehicle path updates within Chennai with active/inactive/maintenance handling.

🔄 Firebase Integration – Ride booking system (customer side) kept separate from MongoDB fleet system.

📍 Geofencing Support – Location-based tracking and alerts.

📖 API Endpoints

🚗 Vehicle Routes (/api/vehicle)

GET /api/vehicle → Get all vehicles

POST /api/vehicle → Add a new vehicle

GET /api/vehicle/:id → Get vehicle by ID

PUT /api/vehicle/:id → Update vehicle details

DELETE /api/vehicle/:id → Delete vehicle

📡 Telemetry Routes (/api/telemetry)

GET /api/telemetry/:vehicleId → Get latest telemetry for a vehicle

POST /api/telemetry → Add telemetry entry (speed, fuel, odometer, etc.)

GET /api/telemetry/history/:vehicleId → Get full telemetry history of a vehicle

🛠 Maintenance Routes (/api/maintenance)

GET /api/maintenance/:vehicleId → Get maintenance records for a vehicle

POST /api/maintenance → Add new maintenance entry

PUT /api/maintenance/:id → Update maintenance record

DELETE /api/maintenance/:id → Delete maintenance record

📊 Strategy Recommendation (/api/strategy)

POST /api/strategy/recommend → Get recommended maintenance strategy (delayed, immediate, scheduled) for a vehicle

📈 Dashboard Routes (/api/dashboard)

GET /api/dashboard/overview → Fleet summary (active vehicles, maintenance, fuel stats, etc.)

GET /api/dashboard/distance → Distance covered by each vehicle

GET /api/dashboard/fuel → Fuel efficiency insights

🔍 Diagnostics Routes (/api/diagnostics)

GET /api/diagnostics/:vehicleId → Run diagnostics and get health status

POST /api/diagnostics → Push diagnostic result/update

🛣 Vehicle Path Routes (/api/vehicle-path)

GET /api/vehicle-path/:vehicleId → Get current path of a vehicle

POST /api/vehicle-path → Assign a new path (with fromDistrict → toDistrict)

DELETE /api/vehicle-path/:vehicleId → Clear path for a vehicle

🚕 Ride Booking Routes (/api/ride-booking)

GET /api/ride-booking → Get all ride bookings (from Firebase)

POST /api/ride-booking → Create a new ride booking

PUT /api/ride-booking/:id → Update ride status (completed, ongoing, etc.)
