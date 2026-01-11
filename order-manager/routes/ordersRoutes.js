const express = require('express');
const router = express.Router();
const Order = require("../model/order")
const jwt = require('jsonwebtoken');
const ObjectId = require('mongoose').Types.ObjectId;
const { isBlacklisted } = require('../model/tokenBlacklist');
const { sendRequest } = require('./kafka/client');
const { v4: uuidv4 } = require('uuid');

// Create Order
router.post('/submit', async (req, res) => {
    const {side , size, price, symbol} = req.body;
    if (!side || !size || !price || !symbol) {
        res.status(400).json({
            message: 'userId, side, size, price and symbol are required in request body'
        });
        return
    }

    if (!['BUY', 'SELL'].includes(side)) {
        res.status(400).json({
          message: 'Invalid value for side.',
        });
        return;
      }
      
    try {
        console.log("Request received on submit. Request body")
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
        console.log(token)

        if (isBlacklisted(token)) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const payload = jwt.verify(token, 'SECRET');
        console.log(payload)

        const newOrder = {
            userId: payload.userId,
            side: req.body.side, 
            size: req.body.size, 
            price: req.body.price, 
            symbol: req.body.symbol, 
            state: "NEW" 
        }
        const order = new Order(newOrder);
        const savedOrder = await order.save();

        res.status(201).json({
            status: "Success", 
            order: savedOrder
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

    //send to matching engine
    try {
        const payload = jwt.verify(token, 'SECRET');
        const orderId = uuidv4();

        try {
           const response = await sendRequest('ORDER_SUBMIT', {
            orderId,
            userId: payload.userId,
            symbol,
            side,
            price: parseFloat(price),
            size: parseFloat(size)
           });

           //response from matching engine
           res.status(201).json({
            status: "Success",
            order: {
                orderId: response.orderId,
                status: response.status,
                filledQuantity: response.filledQuantity || 0,
                remainingQuantity: response.remainingQuantity || size,
                trades: response.trades || []
            }
           });
        } catch (error) {
            if (error.message === 'Request timeout') {
                res.status(504).json({ error: 'Request timeout' });
            } else {
                res.status(500).json({ error: error.message});
            }
        }
    } catch (error) {
        res.status(500).json({ error: error.message});
    }
});

//cancel order 
router.put('/cancel/:id', async (req, res) => {
    try {
        console.log("Request received on cancel. Request params")
        console.log(req.params)

        const authHeader = req.headers.authorization;
        console.log(authHeader)
        if(!authHeader) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const token = authHeader.split(' ')[1];
        console.log(token)

        if (isBlacklisted(token)) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const payload = jwt.verify(token, 'SECRET');
        console.log(payload)

        const {id} = req.params;
        console.log(id)

        const order = await Order.findById(id);
        console.log(order)

        if (!order) {
            res.status(500).json({ error: "Order does not exist"});
            return
        }

        if(order.state === "CANCELLED") {
            res.status(200).json({
                error: "Can't cancel alredy cancelled order."
            });
            return
        }
        
        if(order.state === "TRADED") {
            res.status(200).json({
                error: "Can't cancel traded order."
            });
            return
        }

        if (order.userId == payload.userId) {

            const canceledOrder = await Order.findByIdAndUpdate(
                id,
                {$set: { state: "CANCELLED"}},
                {new: true, runValidators: true}
            );
    
            res.status(200).json({
                status: "Success",
                message: "Oreder canceled successfully",
                order: canceledOrder
            });

        }
        else {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }

    try {
        const response = await sendRequest('ORDER_CANCEL', {
            orderId: id,
            userId: payload.userId
        });

        res.status(200).json({
            status: "Success",
            message: "Order cancelled successfully",
            order: response
        });
    } catch (error) {
        if (error.message === 'Request timeout') {
            res.status(504).json({ error: 'Request timeout' });
        } else {
            res.status(500).json({ error: error.message});
        }
    }
});

//modify update(only size and prise can be modified)
router.put('/update/:id', async (req, res) => { 
    const{size, price} = req.body;
    if (!size || !price) {
        res.status(400).json({
            message: 'Size and prise are required in request body'
        });
        return
    }
    try {
        console.log("Request received on update. Request params")
        console.log(req.params)

        const authHeader = req.headers.authorization;
        console.log(authHeader)
        if(!authHeader) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const token = authHeader.split(' ')[1];
        console.log(token)

        if (isBlacklisted(token)) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const payload = jwt.verify(token, 'SECRET');
        console.log(payload)

        const {id} = req.params;
        const {size, price} = req.body;

        const order = await Order.findById(id);
        console.log(order)

        if (!order) {
            res.status(500).json({ error: "Order does not exist"});
            return
        }

        if (order.state === "CANCELLED") {
            res.status(200).json({
                error: "Can't modify cancelled order."
            });
            return
        }

        if (order.state === "TRADED") {
            res.status(200).json({
                error: "Can't modify traded order."
            });
            return
        }

        if (order.userId == payload.userId) {
            const updateData = {
                state: "AMENDED"
            };
            if (size !== undefined) updateData.size = size;
            if (price !== undefined) updateData.price = price;
    
            const updatedOrder = await Order.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );
    
            res.status(200).json({
                status: "Success",
                message: "Order updated successfully",
                order: updatedOrder
            });
        }

        else {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

    try {
        const response = await sendRequest('ORDER_MODIFY', {
            orderId: id,
            userId: payload.userId
        })
    } catch (error) {
        
    }
});

//search own orders(search by Symbol and side )
router.get('/search/own', async (req, res) => {
    try {
        console.log("Request received on search by own. Request params")
        console.log(req.params)

        const authHeader = req.headers.authorization;
        console.log(authHeader)
        if(!authHeader) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const token = authHeader.split(' ')[1];
        console.log(token)

        if (isBlacklisted(token)) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const payload = jwt.verify(token, 'SECRET');
        console.log(payload)

        const userId = payload.userId;
        
        const order = await Order.find({userId});
        console.log(order)

        res.status(200).json({
            status: "Success",
            orders: order
        })
    } catch (error) {
        res.status(500).json({error: error.message});
    }
})

//Search other orders
router.get('/search', async (req, res) => {
    try {
        console.log("Request received on search by other orders. Request params")
        console.log(req.params)
        console.log(req.query)

        const authHeader = req.headers.authorization;
        console.log(authHeader)
        if(!authHeader) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const token = authHeader.split(' ')[1];
        console.log(token)

        if (isBlacklisted(token)) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const payload = jwt.verify(token, 'SECRET');
        console.log(payload)

        const userId = payload.userId
        console.log(userId)
        const { symbol,side } = req.query;

        const queryjson = {
            symbol, 
            side,
            userId: {$ne: userId}
        }
        console.log(queryjson)
        const order = await Order.find(queryjson);

        if(!symbol || !side) {
            res.status(400).json({
                message: 'Symbol and side required in query params'
            });
            return
        }

        res.status(200).json({
            status: "Success",
            orders: order
        })
    } catch (error) {
        res.status(500).json({error: error.message});
    }
})

//Trade endpoint
router.put('/trade/:id', async (req, res) => {
    try {
        console.log("Request received on trade. Request params")
        console.log(req.params)

        const authHeader = req.headers.authorization;
        console.log(authHeader)
        if(!authHeader) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const token = authHeader.split(' ')[1];
        console.log(token)

        if (isBlacklisted(token)) {
            res.status(401).json({
                message: 'Unauthorized'
            });
            return
        }

        const payload = jwt.verify(token, 'SECRET');
        console.log(payload)

        const {id} = req.params;
        console.log(id)

        const order = await Order.findById(id);
        console.log(order)

        if (!order) {
            res.status(500).json({ error: "Order does not exist"});
            return
        }

        if (order.userId == payload.userId) {
            res.status(200).json({
                error: "Cannot trade own order!."
            });
            return
        }

        if (order.state === "CANCELLED") {
            res.status(200).json({
                error: "Can't trade cancelled order."
            });
            return
        }
        
        if (order.state === "TRADED") {
            res.status(200).json({
                error: "Can't trade alredy traded order."
            });
            return
        }

        const tradedOrder = await Order.findByIdAndUpdate(
            id,
            {$set: { state: "TRADED"}},
            {new: true, runValidators: true}
        );

        res.status(200).json({
            status: "Success",
            message: "Traded",
            order: tradedOrder
        });

    } catch (error) {
        res.status(500).json({error: error.message});
    }

})


module.exports = router;
