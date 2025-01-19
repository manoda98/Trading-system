const express = require("express");
const router = express.Router();
const User = require("../model/user");
const jwt = require('jsonwebtoken');
const { isBlacklisted } = require('../model/tokenBlacklist');

//adjust user deposit endpoint
router.put('/deposit', async (req, res) => { 
    const{userId, symbol, amount} = req.body;
    console.log("request body" , req.body)
    try {
        console.log("Request received amounts endpoint");

        const authHeader = req.headers.authorization;
        if(!authHeader) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const token = authHeader.split(' ')[1];
       

        if (isBlacklisted(token)) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const payload = jwt.verify(token, 'SECRET');
        console.log("payload: ",payload)

        if(payload.userType !== 'ADMIN') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const user = await User.findOne({userId});
        console.log(user)

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const existingBalances = user.balances;
        
        const existingBalance = existingBalances.find(b => b.symbol === symbol);

        let previousBalance;
        let newBalance;
        
        if (existingBalance) {
            previousBalance = existingBalance.balance
            newBalance = existingBalance.balance + amount;
            existingBalance.balance = newBalance;
        } else {
            previousBalance = 0;
            newBalance = amount;
            existingBalances.push({ symbol, balance: newBalance });
        }

        await User.updateOne({userId}, {
            $set: {balances: existingBalances}
        });

        console.log(`Deposit successful. Previous Balance : ${previousBalance} Updated Balance ${newBalance}`)

        res.status(200).json({
            status: "Success",
            message: "amount updated successfully",
            amount: existingBalance
            
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({error: error.message});
    }


});

//adjust user withdraw endpoint
router.put('/withdraw', async (req, res) => { 
    const{userId, symbol, amount} = req.body;
    console.log("request body" , req.body)
    try {
        console.log("Request received withdraw endpoint");

        const authHeader = req.headers.authorization;
        if(!authHeader) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const token = authHeader.split(' ')[1];

        if (isBlacklisted(token)) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const payload = jwt.verify(token, 'SECRET');
        console.log("payload: ",payload)

        if(payload.userType !== 'ADMIN') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const user = await User.findOne({userId});


        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const existingBalances = user.balances;
        
        const existingBalance = existingBalances.find(b => b.symbol === symbol);

        let previousBalance;
        let newBalance;
        
        if (existingBalance) {
            if (existingBalance.balance < amount) {
                return res.status(400).json({ 
                    status: "Error", 
                    message: "Insufficient balance" 
                });
            }
            previousBalance = existingBalance.balance;
            newBalance = existingBalance.balance - amount;
            existingBalance.balance = newBalance;

        } else {
            return res.status(400).json({ 
                status: "Error", 
                message: "No balance available for this symbol" 
            });
        }

        await User.updateOne({ userId }, { $set: { balances: existingBalances } });

        console.log(`Withdraw successful. Previous Balance : ${previousBalance} Updated Balance ${newBalance}`)

        res.status(200).json({
            status: "Success",
            message: "Amount withdrawn successfully",
            amount: existingBalance
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({error: error.message});
    }


});

//get users balances endpoint
router.get('/user-balance/:userId', async(req, res) => {
    try {
        console.log("Request received on user-balance endpoint")

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

        if(payload.userType !== 'ADMIN') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const {userId} = req.params;
        console.log("userId :",userId)

        const user = await User.findOne({userId});
        console.log("user :",user)

        if (!user) {
            res.status(500).json({ error: "User does not exist"});
            return
        }

        if(user.userType = "ADMIN") {
            res.status(200).json({
                status: "Success",
                message: "Balance query is not allowed for ADMIN users",
            });
            return
        }

        res.status(200).json({
            status: "Success",
            message: "Get user balance successfully",
            balances: user.balances
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }

})

module.exports = router;