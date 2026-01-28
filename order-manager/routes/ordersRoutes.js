const express = require('express');
const router = express.Router();
const Order = require("../model/order")
const jwt = require('jsonwebtoken');
const ObjectId = require('mongoose').Types.ObjectId;
const { isBlacklisted } = require('../model/tokenBlacklist');
const { sendRequest } = require('../kafka/client');
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
    
    //send to matching engine  
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
        console.log(payload);
        const orderId = uuidv4();

        try {
            console.log("Before sending kafka msg");
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
        res.status(500).json({ error: error.message });
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

        const response = await sendRequest('ORDER_MODIFY', {
            orderId: id,
            userId: payload.userId,
            newSize: parseFloat(size),
            newPrice: parseFloat(price)
        });
    
        res.status(200).json({
        status: "Success",
        message: "Order updated successfully",
        order: response
        });
    } catch (error) {
        if (error.message === 'Request timeout') {
            res.status(504).json({ error: 'Request timeout' });
        } else {
        res.status(500).json({ error: error.message });
        }
    }
});

//search own orders(search by Symbol and side )
router.get('/search/own', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    if (isBlacklisted(token)) return res.status(401).json({ message: 'Unauthorized' });

    const payload = jwt.verify(token, 'SECRET');

    const response = await sendRequest('QUERY_ORDERS', {
      userId: payload.userId,
      ownOnly: true
    });

    res.status(200).json({
      status: "Success",
      orders: response.orders || []
    });
  } catch (error) {
    if (error.message === 'Request timeout') {
      res.status(504).json({ error: 'Request timeout' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});


//Search other orders
router.get('/search', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    if (isBlacklisted(token)) return res.status(401).json({ message: 'Unauthorized' });

    const payload = jwt.verify(token, 'SECRET');

    const symbol = req.query.symbol || "";
    const side = req.query.side || "";

    const response = await sendRequest('QUERY_ORDERS', {
      userId: payload.userId,
      ownOnly: false,    
      symbol,
      side
    });

    res.status(200).json({
      status: "Success",
      orders: response.orders || []
    });

  } catch (error) {
    if (error.message === 'Request timeout') {
      res.status(504).json({ error: 'Request timeout' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});


//Trade endpoint
router.post('/trade', async (req, res) => {
  try {
    const { symbol, side, price, size } = req.body;

    if (!symbol || !side || !price || !size) {
      return res.status(400).json({ error: 'symbol, side, price, size are required' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    if (isBlacklisted(token)) return res.status(401).json({ message: 'Unauthorized' });

    const payload = jwt.verify(token, 'SECRET');

    // ✅ NEW: opposite side
    const oppositeSide = side === "BUY" ? "SELL" : "BUY";
    const orderId = uuidv4();

    const response = await sendRequest('ORDER_SUBMIT', {
      orderId,
      userId: payload.userId,
      symbol,
      side: oppositeSide,
      price: parseFloat(price),
      size: parseFloat(size)
    });

    res.status(200).json({
      status: "Success",
      order: response
    });

  } catch (error) {
    if (error.message === 'Request timeout') {
      res.status(504).json({ error: 'Request timeout' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});



module.exports = router;
