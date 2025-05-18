const mongoose = require("mongoose");

const CostRecordSchema = new mongoose.Schema({
    vehicle_id: String,
    date: Date,
    expense_type: String,
    amount: Number
});

module.exports = mongoose.model("CostRecord", CostRecordSchema);
