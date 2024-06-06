const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who made the enquiry
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, // Admin who handled the enquiry (if applicable)
  subject: { type: String, required: true }, // Subject of the enquiry
  message: { type: String, required: true }, // Content of the enquiry message
  status: { type: String, enum: ['open', 'closed','pending'], default: 'pending' }, // Status of the enquiry
  // You can add more fields as needed, such as timestamps for creation and updates
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
