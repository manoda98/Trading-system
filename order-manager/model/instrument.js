const mongoose = require("mongoose")

const instrumenstSchema = new mongoose.Schema({
    symbol: { type: String, required: true},
    instrumentType: { type: String, enum: ["CURRENCY", "COMMODITY"], required: true}
});

module.exports = mongoose.model("Instruments", instrumenstSchema)