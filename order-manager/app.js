const express = require('express');
const mongoose = require("mongoose")
const orderRoutes = require('./routes/ordersRoutes');
const authenticationRoutes = require('./routes/authenticationRoutes');
const instrumentRoutes = require('./routes/instrumentsRoutes');
const accountsRoutes = require('./routes/accountsRoutes');
const usersRoutes = require('./routes/usersRoutes');
const cors = require('cors')

const app = express();
app.use(cors())

let mongoHost;
if (process.env.MONGO_HOST) {
    mongoHost = process.env.MONGO_HOST;
} else {
    mongoHost = "localhost";
}

// mongoose.connect(`mongodb://${mongoHost}:27017/trading`)

mongoose.connect(`mongodb://${mongoHost}:27017`, {
    dbName: "trading",
    user: "admin",
    pass: "password"
})

app.use(express.json());

app.use('/api/order', orderRoutes);
app.use('/api/user', authenticationRoutes);
app.use('/api/instrument', instrumentRoutes);
app.use('/api/accounts', accountsRoutes); 
app.use('/api/users', usersRoutes); 


 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
