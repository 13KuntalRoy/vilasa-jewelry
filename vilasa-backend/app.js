// const express = require("express");
// const app = express();
// const errorMiddleware = require("./middleware/error");
// const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
// const fileUpload = require("express-fileupload"); // Middleware for handling file uploads
// const path = require("path");
// const cors = require("cors");
// const cronSchedule = require('./Schedule');
// const listEndpoints = require('express-list-endpoints');
// const dotenv = require("dotenv");
// dotenv.config({ path: "vilasa-backend/config/config.env" });

// // Importing routes
// const user = require("./routes/userRoute");
// const order = require("./routes/orderRoute");
// const product = require("./routes/productRoute");
// const payment = require("./routes/paymentRoute");
// const chat = require("./routes/chatRoute");
// const dyimg = require("./routes/dynamicImageRoutes");
// const dyurl = require("./routes/urlRoutes");
// const invoice = require("./routes/invoiceRoute");
// const enquiry = require("./routes/enquiryRoute")
// const ErrorHandler = require('./utils/errorHandler');
// const subscriber = require('./routes/subscriberRouter');
// const contact = require('./routes/contactRoute')
// const teamProfile = require('./routes/teamprofileRoute')
// const cart = require('./routes/cartRoute')
// const wishlist = require('./routes/wishlistRoute')
// const cal = require('./routes/calRoute')
// const videos = require('./routes/videoRoute')

// // Middleware setup
// app.use(cookieParser()); // Middleware for parsing cookies
// app.use(express.json()); // Middleware for parsing JSON bodies
// // app.use(bodyParser.json({ limit: "50mb" })); // Middleware for parsing JSON with a size limit
// // app.use(bodyParser.urlencoded({ limit: "50mb", extended: true })); // Middleware for parsing URL-encoded data with a size limit
// app.use(bodyParser.json({ limit: "100mb", type: 'application/json' }));
// app.use(bodyParser.urlencoded({ limit: "100mb", extended: true, type: 'application/x-www-form-urlencoded' }));



// app.use(fileUpload({
//   useTempFiles: true,
//   tempFileDir: '/tmp/',
//   limits: { fileSize: 100 * 1024 * 1024 }, // Set limit to 100MB for file uploads
// })); // Middleware for handling file uploads
// app.use(cors(
//   {
//     origin:["http://localhost:5173","https://vilasajewelry.netlify.app","http://localhost:3000","http://localhost"],
//     methods:["GET","POST","PUT","DELETE","PATCH"],
//     credentials:true


//   }
// )); 

// // Middleware for enabling CORS

// // Custom error handling middleware
// app.use(errorMiddleware);

// // Route setup
// app.use("/api/vilasa-v1/vproduct", product); // Product routes
// app.use("/api/vilasa-v1/user", user); // User routes
// app.use("/api/vilasa-v1/order", order); // Order routes
// app.use("/api/vilasa-v1/payment", payment); // Payment routes
// app.use("/api/vilasa-v1/chat/v.0.0.1",chat);
// app.use("/api/vilasa-v1/db-img/vilasa", dyimg);
// app.use("/api/vilasa-v1/db-url/vilasa", dyurl);
// app.use("/api/vilasa-v1/order/report",invoice);
// app.use("/api/vilasa-v1/venquiry/f1",enquiry);
// app.use("/api/vilasa-v1/subscriberapi",subscriber);
// app.use("/api/vilasa-v1/contact/v1",contact);
// app.use("/api/vilasa-v1/teamProfile/v1",teamProfile);
// app.use("/api/vilasa-v1/cart/v1",cart);
// app.use("/api/vilasa-v1/wishlist/v1",wishlist);
// app.use("/api/vilasa-v1/dashboard",cal)
// app.use("/api/vilasa-v1/video", videos); 

// // Middleware to expose endpoint list only in development mode

// const environment = process.env.NODE_ENV || 'development';

// if (environment === 'development') {
//   app.get('/api/Secrete/endpoints', (req, res) => {
//     console.log('Middleware triggered. Getting endpoints...');
//     const endpoints = listEndpoints(app);
//     console.log('Endpoints retrieved:', endpoints);
//     res.json(endpoints);
//   });
// }
// // Middleware to handle errors
// app.use((err, req, res, next) => {
//   // Check if the error is an instance of our custom ErrorHandler
//   if (err instanceof ErrorHandler) {
//       // Send JSON response with error details
//       res.status(err.statusCode).json(err.toJSON());
//   } else {
//       console.error(err);
//       res.status(500).json({
//           success: false,
//           error: {
//               message: 'Internal Server Error',
//               statusCode: 500
//           }
//       });
//   }
// });

// // Simple middleware for logging each request to the console
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   next();
// });

// module.exports = app;
const express = require("express");
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require("dotenv");
const connectDatabase = require("./database/connectdatabase");
const cloudinary = require("cloudinary");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const path = require("path");
const cors = require("cors");
const cronSchedule = require('./Schedule');
const listEndpoints = require('express-list-endpoints');
const ErrorHandler = require('./utils/errorHandler');

dotenv.config({ path: "vilasa-backend/config/config.env" });

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:5173",
            "https://vilasajewelry.netlify.app",
            "http://localhost:3000",
            "http://localhost"
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
    }
});

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
    origin:["http://localhost:5173","https://vilasajewelry.netlify.app","http://localhost:3000","http://localhost"],
    methods:["GET","POST","PUT","DELETE","PATCH"],
    credentials:true
}));

app.get('/api/pincodeserviceable', async (req, res) => {
  try {
    const pincode = req.query.pincode;
    const response = await axios.get(`https://app.shipway.com/api/pincodeserviceable?pincode=${pincode}&payment_type=P`, {
      headers: {
        'Authorization': req.headers.authorization  // Forward the Authorization header
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Failed to proxy request' });
  }
});
// Connect to MongoDB
connectDatabase();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('A user connected', socket.id);

    // Handle chat message event
    socket.on('chat_message', ({ room, msg }) => {
        console.log('Message: ' + msg);
        socket.to(room).emit("receive-message", msg);
    });

    socket.on('enquiry', (enquiry) => {
        console.log('New enquiry:', enquiry);
        io.emit("New_Enquiry", enquiry);
    });

    socket.on("join-room", (room) => {
        socket.join(room);
        console.log(`User joined room ${room}`);
    });

    // Handle status change
    socket.on('status_change', (updatedEnquiry) => {
        console.log('Status change:', updatedEnquiry);
        io.emit("Enquiry_Status_Changed", updatedEnquiry);
    });

    socket.on("deleteEnquiryById", (enquiryId) => {
        console.log(`Enquiry deleted: ${enquiryId}`);
        io.emit("delete-enquiry", enquiryId);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Route setup
const user = require("./routes/userRoute");
const order = require("./routes/orderRoute");
const product = require("./routes/productRoute");
const payment = require("./routes/paymentRoute");
const chat = require("./routes/chatRoute");
const dyimg = require("./routes/dynamicImageRoutes");
const dyurl = require("./routes/urlRoutes");
const invoice = require("./routes/invoiceRoute");
const enquiry = require("./routes/enquiryRoute")
const subscriber = require('./routes/subscriberRouter');
const contact = require('./routes/contactRoute')
const teamProfile = require('./routes/teamprofileRoute')
const cart = require('./routes/cartRoute')
const wishlist = require('./routes/wishlistRoute')
const cal = require('./routes/calRoute')
const videos = require('./routes/videoRoute')

app.use("/api/vilasa-v1/vproduct", product);
app.use("/api/vilasa-v1/user", user);
app.use("/api/vilasa-v1/order", order);
app.use("/api/vilasa-v1/payment", payment);
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
app.use("/api/vilasa-v1/dashboard",cal)
app.use("/api/vilasa-v1/video", videos);

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
