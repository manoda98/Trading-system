const mongoose = require("mongoose")
const bcrypt = require('bcrypt');
const saltRounds = 10;


const usersSchema = new mongoose.Schema({
    userId: { type: String, required: true},
    password: { type: String, required: true},
});


module.exports = mongoose.model("User", usersSchema)