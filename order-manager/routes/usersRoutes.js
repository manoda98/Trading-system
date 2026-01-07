const express = require('express');
const router = express.Router();
const User = require("../model/user")
const jwt = require('jsonwebtoken');
const ObjectId = require('mongoose').Types.ObjectId;
const { isBlacklisted } = require('../model/tokenBlacklist');


//get users endpoint
router.get('/', async (req, res) => {
    try {
        console.log("Request received on get endpoint");

        const authHeader = req.headers.authorization;
        console.log(authHeader)
        if(!authHeader) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const token = authHeader.split(' ')[1];
        console.log("Token : ",token)

        if (isBlacklisted(token)) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const payload = jwt.verify(token, 'SECRET');
        console.log("payload: ",payload)

        const users = await User.find({userType : "TRADER"});
        console.log("User:", users);


        if (!users) {
            users = [];
        }

        

        res.status(200).json({
            status: "Success",
            message: "user get successfuly",
            users
        });


    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
})

module.exports = router;