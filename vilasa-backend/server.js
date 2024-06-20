const { app, httpServer } = require('./app');
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: "vilasa-backend/config/config.env" });

// Start the server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is listening on PORT ${PORT}`);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error(`Uncaught Exception: ${err.message}`);
    console.error("Shutting down the server due to an uncaught exception");
    process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error(`Unhandled Promise Rejection: ${err.message}`);
    console.error("Shutting down the server due to an unhandled promise rejection");
    httpServer.close(() => {
        process.exit(1);
    });
});

// Graceful shutdown on SIGINT signal (Ctrl+C)
process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    httpServer.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});

// Log when the server is closed unexpectedly
httpServer.on('close', () => {
    console.log('Server closed unexpectedly.');
});

// const app = require('./app');
// const dotenv = require("dotenv");
// const connectDatabase = require("./database/connectdatabase");
// const cloudinary = require("cloudinary");
// const http = require('http');
// const { Server } = require('socket.io');

// // Load environment variables
// dotenv.config({ path: "vilasa-backend/config/config.env" });

// // Connect to MongoDB
// connectDatabase();

// // Configure Cloudinary
// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_NAME,
//     api_key: process.env.API_KEY,
//     api_secret: process.env.API_SECRET,
// });


// // Create an HTTP server
// const server = http.createServer(app);

// // Integrate Socket.IO with the HTTP server
// const io = new Server(server, {
//     cors: {
//         origin: [
//             "http://localhost:5173",
//             "https://vilasajewelry.netlify.app",
//             "http://localhost:3000",
//             "http://localhost"
//         ],
//         methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//         credentials: true,
//     }
// });

// // Socket.IO connection handler
// io.on('connection', (socket) => {
//     console.log('A user connected', socket.id);

//     // Handle chat message event
//     socket.on('chat_message', ({ room, msg }) => {
//         console.log('Message: ' + msg);
//         socket.to(room).emit("receive-message", msg);
//     });

//     socket.on('enquiry', (enquiry) => {
//         console.log('New enquiry:', enquiry);
//         io.emit("New_Enquiry", enquiry);
//     });

//     socket.on("join-room", (room) => {
//         socket.join(room);
//         console.log(`User joined room ${room}`);
//     });

//     // Handle status change
//     socket.on('status_change', (updatedEnquiry) => {
//         console.log('Status change:', updatedEnquiry);
//         io.emit("Enquiry_Status_Changed", updatedEnquiry);
//     });

//     socket.on("deleteEnquiryById", (enquiryId) => {
//         console.log(`Enquiry deleted: ${enquiryId}`);
//         io.emit("delete-enquiry", enquiryId);
//     });

//     // Handle disconnection
//     socket.on('disconnect', () => {
//         console.log('User disconnected');
//     });
// });

// // Start the server
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//     console.log(`Server is listening on PORT ${PORT}`);
// });

// // Handle uncaught exceptions
// process.on("uncaughtException", (err) => {
//     console.error(`Uncaught Exception: ${err.message}`);
//     console.error("Shutting down the server due to an uncaught exception");
//     process.exit(1);
// });

// // Handle unhandled promise rejections
// process.on("unhandledRejection", (err) => {
//     console.error(`Unhandled Promise Rejection: ${err.message}`);
//     console.error("Shutting down the server due to an unhandled promise rejection");
//     server.close(() => {
//         process.exit(1);
//     });
// });

// // Graceful shutdown on SIGINT signal (Ctrl+C)
// process.on('SIGINT', () => {
//     console.log('SIGINT received. Shutting down gracefully...');
//     server.close(() => {
//         console.log('Server stopped.');
//         process.exit(0);
//     });
// });

// // Log when the server is closed unexpectedly
// server.on('close', () => {
//     console.log('Server closed unexpectedly.');
// });
// const { app, httpServer } = require('./app');
// const dotenv = require("dotenv");

// // Load environment variables
// dotenv.config({ path: "vilasa-backend/config/config.env" });

// // Start the server
// const PORT = process.env.PORT || 5000;
// httpServer.listen(PORT, () => {
//     console.log(`Server is listening on PORT ${PORT}`);
// });

// // Handle uncaught exceptions
// process.on("uncaughtException", (err) => {
//     console.error(`Uncaught Exception: ${err.message}`);
//     console.error("Shutting down the server due to an uncaught exception");
//     process.exit(1);
// });

// // Handle unhandled promise rejections
// process.on("unhandledRejection", (err) => {
//     console.error(`Unhandled Promise Rejection: ${err.message}`);
//     console.error("Shutting down the server due to an unhandled promise rejection");
//     httpServer.close(() => {
//         process.exit(1);
//     });
// });

// // Graceful shutdown on SIGINT signal (Ctrl+C)
// process.on('SIGINT', () => {
//     console.log('SIGINT received. Shutting down gracefully...');
//     httpServer.close(() => {
//         console.log('Server stopped.');
//         process.exit(0);
//     });
// });

// // Log when the server is closed unexpectedly
// httpServer.on('close', () => {
//     console.log('Server closed unexpectedly.');
// });
