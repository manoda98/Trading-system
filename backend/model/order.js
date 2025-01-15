const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    side: { type: String, enum: ["BUY", "SELL"], required: true},
    userId: { type: String, required: true},
    size: { type: Number, required: true},
    price: { type: Number, required: true},
    symbol: { type: String, enum: ["GOOGLE", "APPLE", "AMAZON"], required: true},
    state: { type: String, required: true}
});

module.exports = mongoose.model("Order", orderSchema)