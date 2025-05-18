const express = require("express");
const { getVehicleData , getScenarioPredictions } = require("../controllers/vehicleController");

const router = express.Router();

router.get("/:vehicleId/scenario/:option", getScenarioPredictions);


router.get("/test", (req, res) => {
    res.json({ message: "Test route working" });
});

router.get("/:id", getVehicleData);

module.exports = router;
