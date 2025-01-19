const express = require('express');
const router = express.Router();
const Instruments = require("../model/instrument")
const User = require("../model/user")
const jwt = require('jsonwebtoken');
const { isBlacklisted } = require('../model/tokenBlacklist');

//Instrument creation endpoint
router.post('/create-instrument', async (req, res) => {
    const {symbol, instrumentType} = req.body;
    
    if (!symbol || !instrumentType) {
        res.status(400).json({
            message: 'Instrument id, InstrumentType and symbol are required in request body'
        });
        return
    }

    try {
        console.log("Request received on create-instrument. Request body")
        console.log(req.body)

        const authHeader = req.headers.authorization;
        console.log(authHeader)
        if(!authHeader) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }
        
        const token = authHeader.split(' ')[1];
        console.log("token: ", token)

        if (isBlacklisted(token)) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const payload = jwt.verify(token, 'SECRET');
        console.log("payload: ", payload)

        const newInstrument = {
            symbol : req.body.symbol,
            instrumentType : req.body.instrumentType
        }
        const instruments = new Instruments(newInstrument);
        const savedInstrument = await instruments.save();

        res.status(201).json({
            status: "Success", 
            instruments: savedInstrument
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }


})


//Instrument deletion endpoint
router.delete('/delete-instrument/:id' , async (req, res) => {
        try {
            console.log("Request received on Delete endpoint")
    
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
    
            const {id} = req.params;
            console.log("id :",id)
    
            const instrument = await Instruments.findById(id);
            console.log("Instrument :",instrument)
    
            if (!instrument) {
                res.status(500).json({ error: "Instrument does not exist"});
                return
            }
    
            const deleteInstrument = await Instruments.findByIdAndDelete(
                id,
            );

            res.status(200).json({
                status: "Success",
                message: "Instrument deleted successfully",
                instrument: deleteInstrument
            });
    
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: error.message });
        }

})

//get instrument endpoint
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

        const {instrumentType} = req.query;

        let queryjson = {
            instrumentType
        }

        if(!instrumentType) {
            queryjson = {};
        }
        
        console.log(queryjson)
        const instruments = await Instruments.find(queryjson);

        res.status(200).json({
            status: "Success",
            instruments
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
})

module.exports = router;