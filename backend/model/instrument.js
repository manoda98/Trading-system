const mongoose = require("mongoose")

const instrumenstSchema = new mongoose.Schema({
    userBalance: { type: String, required: true},
    symbol: { type: String, enum: ["GOOGLE", "APPLE", "AMAZON"], required: true},
    instrumentType: { type: String, enum: ["CURRENCY", "COMMODITY"], required: true}
});

module.exports = mongoose.model("Instruments", instrumenstSchema)