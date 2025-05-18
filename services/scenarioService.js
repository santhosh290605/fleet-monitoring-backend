const calculateFutureImpact = (currentData, maintenanceOption) => {
    const predictions = [];

    currentData.forEach((data) => {
        let projectedSpeed = data.speed;
        let projectedFuelEfficiency = 100 - data.engine_load;
        let projectedMaintenanceCost = 0;
        let riskLevel = "Low";

        if (maintenanceOption === "immediate") {
            projectedSpeed += 5;
            projectedFuelEfficiency += 3;
            projectedMaintenanceCost = 200; // Preventive cost
            riskLevel = "Low";
        } 
        else if (maintenanceOption === "scheduled") {
            projectedSpeed += 2;
            projectedFuelEfficiency += 1.5;
            projectedMaintenanceCost = 500; // Moderate cost
            riskLevel = "Medium";
        } 
        else if (maintenanceOption === "delayed") {
            projectedSpeed -= 5;
            projectedFuelEfficiency -= 4;
            projectedMaintenanceCost = 1500; // High cost due to breakdown
            riskLevel = "High";
        }

        predictions.push({
            vehicle_id: data.vehicle_id,
            scenario: maintenanceOption,
            predicted_speed: projectedSpeed,
            predicted_fuel_efficiency: projectedFuelEfficiency,
            estimated_maintenance_cost: projectedMaintenanceCost,
            risk_level: riskLevel,
        });
    });

    return predictions;
};

module.exports = calculateFutureImpact;
