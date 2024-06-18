const mongoose = require('mongoose');

/**
 * Payment Schema
 * Represents payment transactions in the e-commerce system.
 * Author: Kuntal Roy
 * Vilasa confidential.
 */
const paymentSchema = new mongoose.Schema({
  // Reference to the User who made the payment
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Payment result information
  resultInfo: {
    // Status of the payment result (e.g., Success, Failure)
    resultStatus: {
      type: String,
      required: true,
      // Explanation: Status of the payment result. Must be provided.
    },
    // Result code provided by the payment gateway
    resultCode: {
      type: String,
      required: true,
      // Explanation: Result code provided by the payment gateway. Must be provided.
    },
    // Detailed message regarding the payment result
    resultMsg: {
      type: String,
      required: true,
      // Explanation: Detailed message regarding the payment result. Must be provided.
    },
  },
  // Transaction ID provided by the payment gateway
  txnId: {
    type: String,
    // required: true,
    // Explanation: Transaction ID provided by the payment gateway. Must be provided.
  },
  // Bank transaction ID provided by the payment gateway
  bankTxnId: {
    type: String,
    // required: true,
    // Explanation: Bank transaction ID provided by the payment gateway. Must be provided.
  },
  // Order ID associated with the payment
  // orderId: {
  //   type: String,
  //   required: true,
  //   // Explanation: Order ID associated with the payment. Must be provided.
  // },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  razorpayOrderId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  // Transaction amount
  txnAmount: {
    type: String,
    // required: true,
    // Explanation: Transaction amount. Must be provided.
  },
  // Type of transaction (e.g., Debit, Credit)
  txnType: {
    type: String,
    // required: true,
    // Explanation: Type of transaction (e.g., Debit, Credit). Must be provided.
  },
  // Name of the payment gateway used
  gatewayName: {
    type: String,
    required: true,
    // Explanation: Name of the payment gateway used. Must be provided.
  },
  // Name of the bank involved in the transaction
  bankName: {
    type: String,
    // required: true,
    // Explanation: Name of the bank involved in the transaction. Must be provided.
  },
  // Merchant ID provided by the payment gateway
  mid: {
    type: String,
    // required: true,
    // Explanation: Merchant ID provided by the payment gateway. Must be provided.
  },
  // Payment mode (e.g., Credit Card, Net Banking)
  paymentMode: {
    type: String,
    required: true,
    // Explanation: Payment mode (e.g., Credit Card, Net Banking). Must be provided.
  },
  // Amount refunded (if applicable)
  refundAmt: {
    type: String,
    required: true,
    // Explanation: Amount refunded (if applicable). Must be provided.
  },
  // Date of the transaction
  txnDate: {
    type: String,
    required: true,
    // Explanation: Date of the transaction. Must be provided.
  },
  // Date of creation (automatically set to current date/time)
  createdAt: {
    type: Date,
    default: Date.now,
    // Explanation: Date of creation of the payment record. Automatically set to the current date/time.
  },
});

// Define Payment model
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
