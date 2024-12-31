const express = require("express");
const User = require("../model/user");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const user = require("../model/user");
const saltRounds = 10;
const { add } = require('../model/tokenBlacklist')

const router = express.Router();

let blackListedTokens = [];

//Register endpoint
router.post("/register", async (req, res) => {
    const { userId, password } = req.body;

    if (!userId || !password) {
        res.status(400).json({
            message: 'password and userId are required in request body'
        });
        return
    }

    try {
        const user = await User.findOne({userId});
        console.log(user)
        if (user) {
            res.status(500).json({ error: "UseId already exsists"});
            return
        }
        const newUser = new User({
            userId,
            password: await bcrypt.hash(password , 10)
        });
        await newUser.save();

        res.status(201).json({message: "User registered successfully"});
    } catch (error) {
        console.log(error)
        res.status(500).json({error: error.message });
    }
    
});


//Login endpoint

router.post("/login",async (req,res) => {
    console.log(req.body)
    const { password , userId} = req.body;

    if (!password || !userId) {
        res.status(400).json({
            message: 'password and userId are required in request body'
        });
        return
    }
    
    try {
        const user = await User.findOne({userId});
        console.log(user)

        if (user == null) {
            res.status(500).json({ error: "Invalid username or password"});
            return
        }

        if (await bcrypt.compare(password, user.password)) {

            const payload = {
                userId: user.userId
            };
            const accessToken = jwt.sign(payload, 'SECRET');
            res.status(200).json({
                messaage: "Login successful",
                accessToken
            });
        }
        else {
            res.status(500).json({ error: "Invalid username or password"});
        }


    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//logout endpoint

router.post('/logout', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(400).send('Token is required');
    console.log(token)

    // Add the token to the blacklist
    add(token);
    res.send('Logged out successfully');

});
module.exports = router;