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

// /**
//  * @desc    Handle Razorpay webhook response
//  * @route   POST /api/payments/razorpay/webhook
//  * @access  Public
//  */
// exports.razorpayWebhook = asyncWrapper(async (req, res, next) => {
//   const payload = req.body;
//   console.log(JSON.stringify(payload));
//   console.log(process.env.RAZORPAY_WEBHOOK_SECRET);
//   console.log(req.headers["x-razorpay-signature"]);

//   // Verify the webhook signature using custom validation function
//   const isValidSignature = Razorpay.validateWebhookSignature(
//     JSON.stringify(payload),
//     req.headers["x-razorpay-signature"],
//     process.env.RAZORPAY_WEBHOOK_SECRET
//   );

//   // If the webhook signature is invalid, return a bad request error
//   if (!isValidSignature) {
//     return next(new ErrorHandler("Invalid Webhook Signature", 400));
//   }

//   const { entity } = payload; // Extract the payment entity from the payload

//   try {
//     // Save the payment details to the database using the addPayment function
//     await addPayment(entity);

//     // Handle the payment status based on the 'entity' data received from Razorpay
//     // Additional handling logic can be added here

//     // Respond with status 200 OK to Razorpay
//     res.status(200).send("Webhook Received");
//   } catch (error) {
//     console.error("Error processing webhook:", error);
//     return next(new ErrorHandler("Internal Server Error", 500));
//   }
// });


// const addPayment = async (data) => {
//   try {
//     // Validate input data (optional depending on your application's needs)
//     if (!data.order_id || !data.razorpay_payment_id || !data.amount || !data.currency || !data.status) {
//       throw new ErrorHandler("Invalid payment data received", 400);
//     }

//     // Create a new Payment document in the database using the Payment model
//     const payment = await Payment.create({
//       orderId: data.order_id,
//       txnId: data.razorpay_payment_id,
//       amount: data.amount / 100, // Convert amount from paisa to currency (assuming INR)
//       currency: data.currency,
//       status: data.status,
//       // Additional fields as per your Payment model schema
//       resultInfo: {
//         resultStatus: data.status, // Assuming Razorpay status can be directly used
//         resultCode: data.error_code || '',
//         resultMsg: data.error_description || '',
//       },
//       bankTxnId: data.bank_transaction_id || '',
//       razorpayOrderId: data.razorpay_order_id,
//       txnDate: new Date().toISOString(), // Timestamp of the transaction
//       gatewayName: 'Razorpay', // Assuming it's Razorpay
//       paymentMode: data.method, // Assuming method represents payment mode
//       bankName: data.bank || '', // Bank involved in the transaction
//       mid: data.merchant_id || '', // Merchant ID provided by Razorpay
//       refundAmt: '0', // Assuming initially no refunds
//     });

//     // Log successful payment creation (optional)
//     console.log(`Payment successfully recorded: ${payment}`);

//   } catch (error) {
//     console.error("Error adding payment:", error);
//     throw new ErrorHandler("Payment processing failed", 500); // Throw custom error for centralized error handling
//   }
// };

/**
 * @desc    Handle Razorpay webhook response
 * @route   POST /api/payments/razorpay/webhook
 * @access  Public
 */
exports.razorpayWebhook = asyncWrapper(async (req, res, next) => {
  // const payload = req.body;
  // const signature = req.headers["x-razorpay-signature"];
  // const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // // Log the received payload and signature for debugging
  // console.log('Received Payload:', JSON.stringify(payload));
  // console.log('Received Signature:', signature);

  // // Compute HMAC digest
  // const shasum = crypto.createHmac("sha256", secret);
  // shasum.update(JSON.stringify(payload));
  // const digest = shasum.digest("hex");

  // Log the computed digest for debugging
  // console.log('Computed Digest:', digest);

  // Compare computed digest with received signature
  // const isValidSignature = true;

  // if (!isValidSignature) {
  //   console.error('Invalid Webhook Signature');
  //   return next(new ErrorHandler("Invalid Webhook Signature", 400));
  // }
  const responce = JSON.stringify(req.body)
  try {
    console.log(responce);
    const event = responce.event;
    const entity =  responce.payload.entity;

    // Handle the event based on event type
    switch (event) {
      case 'payment.authorized':
        await handlePaymentAuthorized(entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(entity);
        break;
      case 'payment.captured':
        await handlePaymentCaptured(entity);
        break;
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    // Respond with success message
    res.status(200).send("Webhook Received");
  } catch (error) {
    console.error("Error processing webhook:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});

/**
 * @desc    Handle payment authorized event
 * @param   {Object} entity - Payment entity
 */
const handlePaymentAuthorized = async (entity) => {
  console.log('Payment Authorized:', entity);
  await addPayment(entity);
};

/**
 * @desc    Handle payment failed event
 * @param   {Object} entity - Payment entity
 */
const handlePaymentFailed = async (entity) => {
  console.log('Payment Failed:', entity);
  await addPayment(entity);
};

/**
 * @desc    Handle payment captured event
 * @param   {Object} entity - Payment entity
 */
const handlePaymentCaptured = async (entity) => {
  console.log('Payment Captured:', entity);
  await addPayment(entity);
};

/**
 * @desc    Handle order paid event
 * @param   {Object} entity - Payment entity
 */
const handleOrderPaid = async (entity) => {
  console.log('Order Paid:', entity);
  await addPayment(entity);
};

/**
 * @desc    Add payment to database
 * @param   {Object} data - Payment data
 */
const addPayment = async (data) => {
  try {
    // Validate required payment data
    if (!data.order_id || !data.id || !data.amount || !data.currency || !data.status) {
      throw new ErrorHandler("Invalid payment data received", 400);
    }

    // Create Payment document in the database using Payment model
    const payment = await Payment.create({
      orderId: data.order_id,
      txnId: data.id,
      amount: data.amount / 100, // Convert amount from paisa to currency
      currency: data.currency,
      status: data.status,
      resultInfo: {
        resultStatus: data.status,
        resultCode: data.error_code || '',
        resultMsg: data.error_description || '',
      },
      bankTxnId: data.bank_transaction_id || '',
      razorpayOrderId: data.order_id,
      txnDate: new Date().toISOString(),
      gatewayName: 'Razorpay',
      paymentMode: data.method,
      bankName: data.bank || '',
      mid: data.merchant_id || '',
      refundAmt: '0',
    });

    // Log successful payment creation
    console.log(`Payment successfully recorded: ${payment}`);
  } catch (error) {
    console.error("Error adding payment:", error);
    throw new ErrorHandler("Payment processing failed", 500);
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
