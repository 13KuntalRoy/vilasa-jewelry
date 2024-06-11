const mongoose = require('mongoose');

/**
 * Video Related to Product Schema
 * Represents videos related to artificial jewelry products in the e-commerce system.
 * Author: Kuntal Roy
 * Vilasa confidential
 */
const videoSchema = new mongoose.Schema({
  // ID for the video (auto-generated)
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },

  // Title of the video
  title: {
    type: String,
    required: [true, "Please enter video title"],
    trim: true,
    // Explanation: Title of the video. Required field, trimmed.
  },

  // Description of the video
  description: {
    type: String,
    required: [true, "Please enter video description"],
    // Explanation: Description of the video. Required field.
  },

  // Cloudinary video details
  video: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },

  // Associated product
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, "Please link the video to a product"]
  },

  // Admin user who added the video
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Date when the video was created
  createdAt: {
    type: Date,
    default: Date.now
    // Explanation: Date when the video was created. Default value is the current date.
  }
});

module.exports = mongoose.model('Video', videoSchema);
