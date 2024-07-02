const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
    },
}, {
    timestamps: true, 
});

// Export the model
module.exports = mongoose.model('Material', materialSchema);
