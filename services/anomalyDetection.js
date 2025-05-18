const detectAnomalies = (vehicleData) => {
    const anomalies = [];

    vehicleData.forEach((data) => {
        let issues = [];

        if (data.speed > 120 || data.speed < 0) {
            issues.push("Unusual Speed Detected");
        }

        if (data.engine_rpm < 800 || data.engine_rpm > 5000) {
            issues.push("Engine RPM Out of Range");
        }

        if (data.throttle_position > 95 && data.speed < 10) {
            issues.push("High Throttle at Low Speed");
        }

        if (data.engine_load > 90 && data.speed < 20) {
            issues.push("High Engine Load at Low Speed");
        }

        if (data.fuel_level < 10) {
            issues.push("Low Fuel Warning");
        }

        if (issues.length > 0) {
            anomalies.push({
                vehicle_id: data.vehicle_id,
                timestamp: data.timestamp,
                issues,
            });
        }
    });

    return anomalies;
};

module.exports = detectAnomalies;
