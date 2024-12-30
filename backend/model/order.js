const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    side: { type: String, required: true},
    userId: { type: String, required: true},
    size: { type: Number, required: true},
    price: { type: Number, required: true},
    symbol: { type: String, required: true},
    state: { type: String, required: true}
});

module.exports = mongoose.model("Order", orderSchema)