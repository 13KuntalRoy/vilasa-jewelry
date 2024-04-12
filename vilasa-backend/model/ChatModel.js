const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enquiry: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry', required: true },
  message: { type: String, required: true },
  picture: { type: String },
  senderRole: { type: String, enum: ['user', 'admin'], required: true }, // Role of the sender (user or admin)
  isRead: { type: Boolean, default: false }, // Indicates whether the message has been read
  markedForDeletion: { type: Boolean, default: false }, // Flag to indicate if message is marked for deletion
  deletionDate: { type: Date }, // Date when the message should be deleted
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
