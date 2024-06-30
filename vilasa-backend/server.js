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

