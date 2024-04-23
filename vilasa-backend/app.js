const express = require("express");
const app = express();
const errorMiddleware = require("./middleware/error");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload"); // Middleware for handling file uploads
const path = require("path");
const cors = require("cors");
const cronSchedule = require('./Schedule');
const listEndpoints = require('express-list-endpoints');
const dotenv = require("dotenv");
dotenv.config({ path: "vilasa-backend/config/config.env" });

// Importing routes
const user = require("./routes/userRoute");
const order = require("./routes/orderRoute");
const product = require("./routes/productRoute");
const payment = require("./routes/paymentRoute");
const chat = require("./routes/chatRoute");
const dyimg = require("./routes/dynamicImageRoutes");
const dyurl = require("./routes/urlRoutes");
const invoice = require("./routes/invoiceRoute");
const enquiry = require("./routes/enquiryRoute")
const ErrorHandler = require('./utils/errorHandler');
const subscriber = require('./routes/subscriberRouter');
const contact = require('./routes/contactRoute')
const teamProfile = require('./routes/teamprofileRoute')
const cart = require('./routes/cartRoute')
const wishlist = require('./routes/wishlistRoute')

// Middleware setup
app.use(cookieParser()); // Middleware for parsing cookies
app.use(express.json()); // Middleware for parsing JSON bodies
app.use(bodyParser.json({ limit: "50mb" })); // Middleware for parsing JSON with a size limit
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true })); // Middleware for parsing URL-encoded data with a size limit
app.use(fileUpload()); // Middleware for handling file uploads
app.use(cors(
  {
    origin:["http://localhost:5173","https://vilasajewelry.netlify.app","http://localhost:3000"],
    methods:["GET","POST","PUT","DELETE"],
    credentials:true


  }
)); 

// Middleware for enabling CORS

// Custom error handling middleware
app.use(errorMiddleware);

// Route setup
app.use("/api/vilasa-v1/vproduct", product); // Product routes
app.use("/api/vilasa-v1/user", user); // User routes
app.use("/api/vilasa-v1/order", order); // Order routes
app.use("/api/vilasa-v1/payment", payment); // Payment routes
app.use("/api/vilasa-v1/chat/v.0.0.1",chat);
app.use("/api/vilasa-v1/db-img/vilasa", dyimg);
app.use("/api/vilasa-v1/db-url/vilasa", dyurl);
app.use("/api/vilasa-v1/order/report",invoice);
app.use("/api/vilasa-v1/venquiry/f1",enquiry);
app.use("/api/vilasa-v1/subscriberapi",subscriber);
app.use("/api/vilasa-v1/contact/v1",contact);
app.use("/api/vilasa-v1/teamProfile/v1",teamProfile);
app.use("/api/vilasa-v1/cart/v1",cart);
app.use("/api/vilasa-v1/wishlist/v1",wishlist);

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
// Serve static files from the frontend build directory
// const __dirname1 = path.resolve();
// app.use(express.static(path.join(__dirname1, "/frontend/build")));

// //Serve the React app for any other routes
// app.get("*", (req, res) =>
//   res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
// );
// Error handling middleware
app.use((err, req, res, next) => {
  // Check if the error is an instance of our custom ErrorHandler
  if (err instanceof ErrorHandler) {
      // Send JSON response with error details
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

module.exports = app;
