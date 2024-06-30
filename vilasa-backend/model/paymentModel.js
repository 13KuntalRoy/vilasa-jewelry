const mongoose = require('mongoose');

/**
 * Payment Schema
 * Represents payment transactions in the e-commerce system.
 */
const paymentSchema = new mongoose.Schema({
  // Reference to the User who made the payment
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  contact: {
    type: String,
  },
  // Payment result information
  resultInfo: {
    // Status of the payment result (e.g., Success, Failure)
    resultStatus: {
      type: String,
      required: true,
    },
    // Result code provided by the payment gateway
    resultCode: {
      type: String,
    },
    // Detailed message regarding the payment result
    resultMsg: {
      type: String,
    },
  },
  // Transaction ID provided by the payment gateway
  txnId: {
    type: String,
  },
  // Bank transaction ID provided by the payment gateway
  bankTxnId: {
    type: String,
  },
  // Order ID associated with the payment
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  // Razorpay Order ID
  razorpayOrderId: {
    type: String,
    required: true,
  },
  // Status of the payment
  status: {
    type: String,
    required: true,
  },
  // Amount of the transaction
  amount: {
    type: Number,
    required: true,
  },
  // Base amount of the transaction
  baseAmount: {
    type: Number,
  },
  // Currency of the transaction
  currency: {
    type: String,
  },
  // International transaction indicator
  international: {
    type: Boolean,
  },
  // Payment method used (e.g., UPI, Credit Card)
  method: {
    type: String,
  },
  // Amount refunded (if applicable)
  amountRefunded: {
    type: Number,
  },
  // Amount transferred (if applicable)
  amountTransferred: {
    type: Number,
  },
  // Refund status
  refundStatus: {
    type: String,
  },
  // Payment capture status
  captured: {
    type: Boolean,
  },
  // Payment description
  description: {
    type: String,
  },
  // ID of the card used (if applicable)
  cardId: {
    type: String,
  },
  // Name of the bank involved in the transaction
  bank: {
    type: String,
  },
  // Wallet used for payment (if applicable)
  wallet: {
    type: String,
  },
  // Virtual Payment Address (VPA) used for UPI transactions
  vpa: {
    type: String,
  },
  // Email associated with the payment
  email: {
    type: String,
  },
  // Contact number associated with the payment
  contact: {
    type: String,
  },
  // Notes related to the payment
  notes: {
    type: [String],
  },
  // Fee charged for the transaction
  fee: {
    type: Number,
  },
  // Tax amount
  tax: {
    type: Number,
  },
  // Error code related to the payment (if any)
  errorCode: {
    type: String,
  },
  // Error description related to the payment (if any)
  errorDescription: {
    type: String,
  },
  // Source of the payment error (if any)
  errorSource: {
    type: String,
  },
  // Step where the error occurred (if any)
  errorStep: {
    type: String,
  },
  // Reason for the payment error (if any)
  errorReason: {
    type: String,
  },
  // Acquirer data associated with the payment
  acquirerData: {
    rrn: {
      type: String,
    },
  },
  // Date of creation (automatically set to current date/time)
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Additional fields for UPI payment method
  upi: {
    payer_account_type: {
      type: String,
    },
    flow: {
      type: String,
    },
  },
});

// Define Payment model
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
