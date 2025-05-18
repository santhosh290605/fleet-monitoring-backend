function getRandomInRange(min, max) {
    return +(Math.random() * (max - min) + min).toFixed(2);
  }
  
  function simulateModelPredictions(data) {
    const strategies = [0, 1, 2];
  
    const predicted_maintenance_cost = [];
    const predicted_speed = [];
    const predicted_fuel_efficiency = [];
    const risk_level = [];
  
    const baseCost = data.last_maintenance_cost || 5000;
  
    strategies.forEach((strategy) => {
      // Simulate cost with variance
      let costMultiplier;
      if (strategy === 0) costMultiplier = getRandomInRange(1.2, 1.5); // delayed → costly
      else if (strategy === 1) costMultiplier = getRandomInRange(0.7, 1.0); // immediate → cheaper
      else costMultiplier = getRandomInRange(0.9, 1.2); // scheduled → moderate
  
      const cost = +(baseCost * costMultiplier).toFixed(2);
      predicted_maintenance_cost.push(cost);
  
      // Simulate performance
      const speed = getRandomInRange(60, 100);
      const fuel = getRandomInRange(8, 20);
      predicted_speed.push(speed);
      predicted_fuel_efficiency.push(fuel);
  
      // Degradation-aware risk
      const degradation =
        (100 - (data.engine_health || 85)) +
        (data.tire_wear || 20) +
        (100 - (data.oil_quality || 70));
  
      let baseRisk = Math.floor(degradation / 100);
  
      // Strategy effect on risk
      if (strategy === 0) baseRisk += 1; // Delayed → higher risk
      if (strategy === 1) baseRisk -= 1; // Immediate → reduced risk
  
      // Add slight randomness
      const noise = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const risk = Math.max(0, Math.min(2, baseRisk + noise));
      risk_level.push(risk);
    });
  
    // Normalize scores
    const maxCost = Math.max(...predicted_maintenance_cost);
  
    const scores = strategies.map((_, i) => {
      const normalizedCost = predicted_maintenance_cost[i] / maxCost;
      const normalizedFuel = (100 - predicted_fuel_efficiency[i]) / 100;
      const normalizedSpeed = (100 - predicted_speed[i]) / 100;
  
      // Weighted scoring: lower is better
      const score =
        0.5 * risk_level[i] +
        0.2 * normalizedCost +
        0.15 * normalizedFuel +
        0.15 * normalizedSpeed;
  
      return score;
    });
  
    const recommendedStrategy = scores.indexOf(Math.min(...scores));
  
    // Dev Logging (optional)
    console.log({
      predicted_maintenance_cost,
      predicted_speed,
      predicted_fuel_efficiency,
      risk_level,
      scores,
      recommendedStrategy
    });
  
    return {
      predicted_maintenance_cost,
      predicted_speed,
      predicted_fuel_efficiency,
      risk_level,
      recommendedStrategy
    };
  }
  
module.exports = { simulateModelPredictions };
  