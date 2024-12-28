const express = require('express');
const mongoose = require("mongoose")
const orderRoutes = require('./routes/ordersRoutes');
const authenticationRoutes = require('./routes/authenticationRoutes');


const app = express();

let mongoHost;
if (process.env.MONGO_HOST) {
    mongoHost = process.env.MONGO_HOST;
} else {
    mongoHost = "localhost";
}

mongoose.connect(`mongodb://${mongoHost}:27017/trading`)

app.use(express.json());

app.use('/api/order', orderRoutes);
app.use('/api/user', authenticationRoutes);

 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
