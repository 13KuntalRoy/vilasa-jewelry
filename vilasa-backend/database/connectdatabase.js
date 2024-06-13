// const mongoose = require("mongoose");
// require("dotenv").config({ path: "vilasa-backend/config/config.env" });

// /**
//  * Connect to MongoDB database
//  * @returns {Promise<void>} A promise that resolves once the database connection is established
//  */
// async function connectdatabase() {
//     try {
//         // Allow using dot notation in query strings
//         mongoose.set("strictQuery", false); 

//         // Connect to MongoDB
//         await mongoose.connect(process.env.DB_LINK);

//         console.log("MongoDB connected successfully");
//     } catch (error) {
//         // Log any errors that occur during the connection process
//         console.error("MongoDB connection error:", error.message);
//         process.exit(1); // Exit the process with a failure status code
//     }
// }

// module.exports = connectdatabase;
const mongoose = require("mongoose");
require("dotenv").config({ path: "vilasa-backend/config/config.env" });

/**
 * Connect to MongoDB database
 * @returns {Promise<void>} A promise that resolves once the database connection is established
 */
async function connectDatabase() {
    try {
        // Allow using dot notation in query strings
        mongoose.set("strictQuery", false);

        // Connect to MongoDB
        await mongoose.connect(process.env.DB_LINK, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("MongoDB connected successfully");
    } catch (error) {
        // Log any errors that occur during the connection process
        console.error("MongoDB connection error:", error.message);
        process.exit(1); // Exit the process with a failure status code
    }
}

module.exports = connectDatabase;
