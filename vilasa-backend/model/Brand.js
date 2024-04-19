const mongoose = require('mongoose');

/**
 * Brand Schema
 * Represents the brands of products in the e-commerce system.
 * Author: Kuntal Roy
 */
const brandSchema = new mongoose.Schema({
    // Title of the brand
    title: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        // Explanation: Title of the brand. Must be unique and indexed for efficient queries. Lowercased for consistency.
    },
    // Description of the brand
    description: {
        type: String,
        required: true,
        // Explanation: Description of the brand. Must be provided.
    },
    // URL of the brand's picture/logo
    picture: {
        public_id: { type: String},
        url: { type: String}
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    // Explanation: Automatically adds timestamps for creation and updates.
});

// Export the model
module.exports = mongoose.model('Brand', brandSchema);
