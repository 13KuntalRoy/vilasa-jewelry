const mongoose = require('mongoose');

/**
 * Order Schema
 * Represents an order placed by a user in the e-commerce system.
 * Vilasa confidential.
 * Author: Kuntal Roy
 */
const orderSchema = new mongoose.Schema({
  // Order shipping address
  shippingInfo: {
    firstName: {
      type: String,
      required: true,
      // Explanation: First name of the recipient. Required field.
    },
    lastName: {
      type: String,
      required: true,
      // Explanation: Last name of the recipient. Required field.
    },
    address: {
      type: String,
      required: true,
      // Explanation: Shipping address. Required field.
    },
    city: {
      type: String,
      required: true,
      // Explanation: City of the shipping address. Required field.
    },
    state: {
      type: String,
      required: true,
      // Explanation: State of the shipping address. Required field.
    },
    country: {
      type: String,
      required: true,
      default: 'India', // Default value set to India
      // Explanation: Country of the shipping address. Default value is India.
    },
    pinCode: {
      type: String,
      required: true,
      // Explanation: PIN code of the shipping address. Required field.
    },
    phoneNo: {
      type: String,
      required: true,
      // Explanation: Phone number of the recipient. Required field.
    },
    email: {
      type: String,
      required: true,
      // Explanation: Email address of the recipient. Required field.
    },
  },

  // Order item details array
  orderItems: [
    {
      name: {
        type: String,
        required: true,
        // Explanation: Name of the ordered item. Required field.
      },
      price: {
        type: Number,
        required: true,
        // Explanation: Price of the ordered item. Required field.
      },
      quantity: {
        type: Number,
        required: true,
        // Explanation: Quantity of the ordered item. Required field.
      },
      image: {
        type: String,
        required: true,
        // Explanation: Image URL of the ordered item. Required field.
      },
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to the Product model
        required: true,
        // Explanation: ID of the ordered product. Required field.
      },
    },
  ],

  // User who placed the order
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
    // Explanation: User ID who placed the order. Required field.
  },

  // Payment information
  paymentInfo: {
    id: {
      type: String,
      required: true,
      // Explanation: ID of the payment transaction. Required field.
    },
    status: {
      type: String,
      required: true,
      // Explanation: Status of the payment transaction. Required field.
    },
    // Additional payment information can be added here
  },

  // Payment timing
  paidAt: {
    type: Date,
    // Explanation: Date and time when the payment was made.
  },

  // Price details
  itemsPrice: {
    type: Number,
    required: true,
    default: 0,
    // Explanation: Total price of ordered items. Default value is 0.
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0,
    // Explanation: Tax amount. Default value is 0.
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0,
    // Explanation: Shipping charges. Default value is 0.
  },

  // Total price
  totalPrice: {
    type: Number,
    required: true,
    default: 0,
    // Explanation: Total order amount. Default value is 0.
  },

  // Order status
  orderStatus: {
    type: String,
    required: true,
    default: 'Processing', // Default status set to Processing
    // Explanation: Status of the order. Default value is Processing.
    // Possible values: Processing, Pending, Delivered, Confirmed, etc.
  },

  // Date when the order was delivered
  deliveredAt: {
    type: Date,
    // Explanation: Date and time when the order was delivered.
  },

  // Date when the order was created
  createdAt: {
    type: Date,
    default: Date.now,
    // Explanation: Date and time when the order was created. Default value is current date/time.
  },
});

module.exports = mongoose.model('Order', orderSchema);
