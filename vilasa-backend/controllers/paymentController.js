const asyncWrapper = require("../middleware/asyncErrorHandler");
const Razorpay = require("razorpay");
const Order =require("../model/orderModel")
const Payment = require("../model/paymentModel");
const ErrorHandler = require("../utils/errorHandler");
const crypto = require('crypto');
// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});



/**
 * @desc    Create Razorpay order
 * @route   POST /api/payments/razorpay/create-order
 * @access  Public
 */
exports.createRazorpayOrder = asyncWrapper(async (req, res, next) => {
  const { orderId } = req.body;

  // Fetch the order details from the database using the order ID
  const order = await Order.findById(orderId);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  // Create a new Razorpay order
  const options = {
    amount: order.totalPrice * 100, // Amount in paisa
    currency: "INR",
    receipt: orderId,
  };

  const razorpayOrder = await razorpay.orders.create(options);

  // Prepare options for Razorpay checkout
  const razorpayOptions = {
    key: process.env.RAZORPAY_KEY_ID,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    name: "Saiyli",
    description: "Test Transaction",
    order_id: razorpayOrder.id,
    handler: async function (response) {
      // Handle payment success here if needed
    },
    prefill: {
      name: order.shippingInfo.name,
      email: order.shippingInfo.email,
      contact: order.shippingInfo.phone,
    },
  };

  res.status(200).json({
    success: true,
    razorpayOrderId: razorpayOrder.id,
    razorpayOptions,
  });
});

/**
 * @desc    Handle Razorpay webhook response
 * @route   POST /api/payments/razorpay/webhook
 * @access  Public
 */
exports.razorpayWebhook = asyncWrapper(async (req, res, next) => {
  const payload = req.body;

  // Verify the webhook signature using custom validation function
  const isValidSignature = validateRazorpayWebhookSignature(
    req.headers["x-razorpay-signature"],
    JSON.stringify(payload),
    process.env.RAZORPAY_WEBHOOK_SECRET
  );

  // If the webhook signature is invalid, return a bad request error
  if (!isValidSignature) {
    return next(new ErrorHandler("Invalid Webhook Signature", 400));
  }

  const { entity } = payload; // Extract the payment entity from the payload

  try {
    // Save the payment details to the database using the addPayment function
    await addPayment(entity);

    // Handle the payment status based on the 'entity' data received from Razorpay
    // Additional handling logic can be added here

    // Respond with status 200 OK to Razorpay
    res.status(200).send("Webhook Received");
  } catch (error) {
    console.error("Error processing webhook:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});

// Custom function to validate Razorpay webhook signature
function validateRazorpayWebhookSignature(signature, body, secret) {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

const addPayment = async (data) => {
  try {
    // Validate input data (optional depending on your application's needs)
    if (!data.order_id || !data.razorpay_payment_id || !data.amount || !data.currency || !data.status) {
      throw new ErrorHandler("Invalid payment data received", 400);
    }

    // Create a new Payment document in the database using the Payment model
    const payment = await Payment.create({
      orderId: data.order_id,
      txnId: data.razorpay_payment_id,
      amount: data.amount / 100, // Convert amount from paisa to currency (assuming INR)
      currency: data.currency,
      status: data.status,
      // Additional fields as per your Payment model schema
      resultInfo: {
        resultStatus: data.status, // Assuming Razorpay status can be directly used
        resultCode: data.error_code || '',
        resultMsg: data.error_description || '',
      },
      bankTxnId: data.bank_transaction_id || '',
      razorpayOrderId: data.razorpay_order_id,
      txnDate: new Date().toISOString(), // Timestamp of the transaction
      gatewayName: 'Razorpay', // Assuming it's Razorpay
      paymentMode: data.method, // Assuming method represents payment mode
      bankName: data.bank || '', // Bank involved in the transaction
      mid: data.merchant_id || '', // Merchant ID provided by Razorpay
      refundAmt: '0', // Assuming initially no refunds
    });

    // Log successful payment creation (optional)
    console.log(`Payment successfully recorded: ${payment}`);

  } catch (error) {
    console.error("Error adding payment:", error);
    throw new ErrorHandler("Payment processing failed", 500); // Throw custom error for centralized error handling
  }
};

/**
 * @desc    Get payment status by order ID
 * @route   GET /api/payments/status/:id
 * @access  Public
 * @param   {string} id - The order ID
 * @returns {Object} Payment status
 */
exports.getPaymentStatus = asyncWrapper(async (req, res, next) => {
  const orderId = req.params.id; // Extract the order ID from the request

  try {
    // Query the Payment model to find payment details by the order ID
    const payment = await Payment.findOne({ orderId });

    if (!payment) {
      // If payment details are not found, return a not found error
      return next(new ErrorHandler("Payment Details Not Found", 404));
    }

    // If payment details are found, return the payment status to the client
    res.status(200).json({
      success: true,
      payment, // Payment details retrieved from the database
    });
  } catch (error) {
    // If there's an error, handle it appropriately
    console.error("Error fetching payment status:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});

/**
 * @desc    Get all payment information
 * @route   GET /api/payments/all
 * @access  Public
 */
exports.getAllPayments = asyncWrapper(async (req, res, next) => {
  try {
    const payments = await Payment.find();

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    return next(new ErrorHandler("Failed to fetch payments", 500));
  }
});
