// Import required modules
const mongoose = require('mongoose');

// Define the schema for the contact form
const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Simple email validation using regex
        return /\S+@\S+\.\S+/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  enquiryStatus: {
    type: String,
    required: true,
    enum: ['Pending', 'Processing', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a mongoose model based on the schema
const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
