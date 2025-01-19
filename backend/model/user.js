const mongoose = require("mongoose")
const bcrypt = require('bcrypt');
const saltRounds = 10;


const usersSchema = new mongoose.Schema({
    userType: { type: String, enum: ["ADMIN", "TRADER"], required: true},
    userId: { type: String, required: true},
    password: { type: String, required: true},
    balances: {type:Array, default:[]}
});


module.exports = mongoose.model("User", usersSchema)