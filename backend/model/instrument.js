const mongoose = require("mongoose")

const instrumenstSchema = new mongoose.Schema({
    instrumentId: { type: String, required: true},
    symbol: { type: String, required: true},
    instrumentType: { type: String, enum: ["CURRENCY", "COMMODITY"], required: true}
});

module.exports = mongoose.model("Instruments", instrumenstSchema)