const mongoose = require('mongoose');
const Counter = require('./Counter'); // Import the Counter model

// Return Schema
const returnSchema = new mongoose.Schema({
  returnReason: {
    type: String,
    required: true,
  },
  returnStatus: {
    type: String,
    required: true,
    default: 'Pending',
  },
  returnRequestedAt: {
    type: Date,
    default: Date.now,
  },
  returnProcessedAt: {
    type: Date,
  },
});

// Order Schema
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true,
  },
  shippingInfo: {
    name: {
      type: String,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: 'India',
    },
    pinCode: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  orderItems: [
    {
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paymentInfo: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    paymentmethod: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  paidAt: {
    type: Date,
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  orderStatus: {
    type: String,
    required: true,
    default: 'Processing',
  },
  deliveredAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  returnInfo: returnSchema,
  returnInitiatedAt: {
    type: Date,
  },
});

// Pre-save middleware to increment the order ID sequence
orderSchema.pre('save', async function (next) {
  const order = this;
  if (order.isNew) {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;

    const counter = await Counter.findByIdAndUpdate(
      { _id: 'orderId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const sequence = counter.seq.toString().padStart(5, '0');
    order.orderId = `ORD-SAIYLI-${formattedDate}-${sequence}`;
  }
  next();
});

// Export the Order model
module.exports = mongoose.model('Order', orderSchema);
