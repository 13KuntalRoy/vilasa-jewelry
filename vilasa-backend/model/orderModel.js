// module.exports = mongoose.model('Order', orderSchema);
const mongoose = require('mongoose');

// Return Schema
const returnSchema = new mongoose.Schema({
  returnReason: {
    type: String,
    required: true,
    // Explanation: Reason for returning the order. Required field.
  },
  returnStatus: {
    type: String,
    required: true,
    default: 'Pending', // Default status set to Pending
    // Explanation: Status of the return. Default value is Pending.
    // Possible values: Pending, Approved, Rejected, Processed, etc.
  },
  returnRequestedAt: {
    type: Date,
    default: Date.now,
    // Explanation: Date and time when the return was requested. Default value is current date/time.
  },
  returnProcessedAt: {
    type: Date,
    // Explanation: Date and time when the return was processed.
  },
});

// Order Schema
const orderSchema = new mongoose.Schema({
  // Order shipping address
  shippingInfo: {
    name: {
      type: String,
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
    phone: {
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
    // id: {
    //   type: String,
    //   // Explanation: ID of the payment transaction. Required field.
    // },
    id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Payment',
    },
    paymentmethod:{
      type: String,
      required: true,
      // Explanation: Payment method used. Required field.
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

  // Return information
  returnInfo: returnSchema,

  // Date when the return was initiated
  returnInitiatedAt: {
    type: Date,
    // Explanation: Date and time when the return was initiated.
  },}
);

// Export the Order model
module.exports = mongoose.model('Order', orderSchema);
