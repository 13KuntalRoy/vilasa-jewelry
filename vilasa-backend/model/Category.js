const mongoose = require('mongoose');

/**
 * Category Schema
 * Represents the categories of products in the e-commerce system.
 * Author: Kuntal Roy
 */
const categorySchema = new mongoose.Schema({
    // Title of the category
    title: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        // Explanation: Title of the category. Must be unique and indexed for efficient queries. Lowercased for consistency.
    },
    // Image URL for the category (optional)

    image: {
        public_id: { type: String, default: null },
        url: { type: String, default: null }
    }
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    // Explanation: Automatically adds timestamps for creation and updates.
});

// Export the model
module.exports = mongoose.model('Category', categorySchema);
