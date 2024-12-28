const express = require('express');
const mongoose = require("mongoose")
const orderRoutes = require('./routes/ordersRoutes');
const authenticationRoutes = require('./routes/authenticationRoutes');


const app = express();
mongoose.connect("mongodb://localhost:27017/trading")

app.use(express.json());

app.use('/api/order', orderRoutes);
app.use('/api/user', authenticationRoutes);

 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
