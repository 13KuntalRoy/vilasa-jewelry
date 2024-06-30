const express = require("express");
const http = require('http');
const dotenv = require("dotenv");
const connectDatabase = require("./database/connectdatabase");
const cloudinary = require("cloudinary");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const listEndpoints = require('express-list-endpoints');
const ErrorHandler = require('./utils/errorHandler');
const axios = require('axios'); 
dotenv.config({ path: "vilasa-backend/config/config.env" });

const app = express();
const httpServer = http.createServer(app);

// Middleware setup
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json({ limit: "100mb", type: 'application/json' }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true, type: 'application/x-www-form-urlencoded' }));
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: { fileSize: 100 * 1024 * 1024 },
}));
app.use(cors({
    origin: ["http://localhost:5173", "https://vilasajewelry.netlify.app", "http://localhost:3000", "http://localhost"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
}));

// Connect to MongoDB
connectDatabase();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

// Route setup
const user = require("./routes/userRoute");
const order = require("./routes/orderRoute");
const product = require("./routes/productRoute");
const payment = require("./routes/paymentRoute");
const dyimg = require("./routes/dynamicImageRoutes");
const dyurl = require("./routes/urlRoutes");
const subscriber = require('./routes/subscriberRouter');
const contact = require('./routes/contactRoute');
const teamProfile = require('./routes/teamprofileRoute');
const cart = require('./routes/cartRoute');
const wishlist = require('./routes/wishlistRoute');
const cal = require('./routes/calRoute');
const videos = require('./routes/videoRoute');

app.use("/api/saiyli-v1/vproduct", product);
app.use("/api/saiyli-v1/user", user);
app.use("/api/saiyli-v1/order", order);
app.use("/api/saiyli-v1/payment", payment);
app.use("/api/saiyli-v1/db-img/saiyli", dyimg);
app.use("/api/saiyli-v1/db-url/saiyli", dyurl);
app.use("/api/saiyli-v1/subscriberapi", subscriber);
app.use("/api/saiyli-v1/contact/v1", contact);
app.use("/api/saiyli-v1/teamProfile/v1", teamProfile);
app.use("/api/saiyli-v1/cart/v1", cart);
app.use("/api/saiyli-v1/wishlist/v1", wishlist);
app.use("/api/saiyli-v1/dashboard", cal);
app.use("/api/saiyli-v1/video", videos);


// Middleware to expose endpoint list only in development mode
const environment = process.env.NODE_ENV || 'development';

if (environment === 'development') {
    app.get('/api/Secrete/endpoints', (req, res) => {
        console.log('Middleware triggered. Getting endpoints...');
        const endpoints = listEndpoints(app);
        console.log('Endpoints retrieved:', endpoints);
        res.json(endpoints);
    });
}

app.get('/api/pincodeserviceable', async (req, res) => {
    try {
        const pincode = req.query.pincode;
        const response = await axios.get(`https://app.shipway.com/api/pincodeserviceable?pincode=${pincode}&payment_type=P`, {
            headers: {
                'Authorization': req.headers.authship  // Forward the Authorization header
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error proxying request:', error);
        res.status(500).json({ error: 'Failed to proxy request' });
    }
});

// Middleware to handle errors
app.use((err, req, res, next) => {
    if (err instanceof ErrorHandler) {
        res.status(err.statusCode).json(err.toJSON());
    } else {
        console.error(err);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal Server Error',
                statusCode: 500
            }
        });
    }
});

// Simple middleware for logging each request to the console
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

module.exports = { app, httpServer };


