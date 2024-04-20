const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  // User who owns the cart
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Array of items in the cart
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        default: 1
      }
    }
  ],
  // Total price of the items in the cart
  totalPrice: {
    type: Number,
    default: 0
  },
  // Date when the cart was created
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cart', cartSchema);
