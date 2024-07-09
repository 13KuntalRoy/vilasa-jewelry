const asyncWrapper = require("../middleware/asyncErrorHandler");
const Razorpay = require("razorpay");
const Order =require("../model/orderModel")
const Payment = require("../model/paymentModel");
const ErrorHandler = require("../utils/errorHandler");
const { confirmPayment } = require("./orderController");
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


const processedPayments = new Set();

exports.razorpayWebhook = asyncWrapper(async (req, res, next) => {
  try {
    const { event, payload } = req.body;

    if (!event || !payload) {
      return next(new ErrorHandler("Invalid payload structure", 400));

    }
    console.log("====",payload);
    console.log("event",event);

    const entity = payload.payment.entity;

    console.log("*****",entity);
    switch (event) {
      case 'payment.authorized':
        await handlePaymentAuthorized(entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(entity);
        break;
      case 'payment.captured':
        // Check if payment ID has already been processed
        if (processedPayments.has(entity.id)) {
          console.log(`Payment ${entity.id} already processed. Ignoring duplicate webhook.`);
          return res.status(200).send("Webhook Received");
        }
        
        await handlePaymentCaptured(entity);
        confirmPayment(entity.notes.orderId); // Assuming this function confirms the payment in your system
        processedPayments.add(entity.id); // Add payment ID to processed list
        break;
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    res.status(200).send("Webhook Received");
  } catch (error) {
    console.error("Error processing webhook:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});

const handlePaymentAuthorized = async (entity) => {
  console.log('Payment Authorized:', entity);
  await addPayment(entity);
};

const handlePaymentFailed = async (entity) => {
  console.log('Payment Failed:', entity);
  await addPayment(entity);
};

const handlePaymentCaptured = async (entity) => {
  console.log('Payment Captured:', entity);
  await addPayment(entity);
};

const addPayment = async (data) => {
  try {
    console.log(data);
    if (!data.id || !data.amount || !data.currency || !data.status) {
      throw new ErrorHandler("Invalid payment data received", 400);
    }

    const convertToRupees = (amountInPaisa) => (amountInPaisa / 100).toFixed(2);

    const payment = await Payment.create({
      orderId: data.notes.orderId || "NA",
      txnId: data.id,
      amount: convertToRupees(data.amount),
      currency: data.currency,
      txnAmount: convertToRupees(data.tax || 0),
      status: data.status,
      name: data.notes.name || "NA",
      email: data.notes.email || "NA",
      contact: data.notes.contact || "NA",
      resultInfo: {
        resultStatus: data.status,
        resultCode: data.error_code || "NA",
        resultMsg: data.error_description || "NA",
      },
      bankTxnId: data.acquirer_data?.bank_transaction_id || "NA",
      razorpayOrderId: data.order_id,
      txnDate: new Date(data.created_at * 1000).toISOString() || new Date().toISOString(),
      gatewayName: 'Razorpay',
      userId: data.notes?.userId || "NA",
      paymentMode: data.method || "NA",
      bankName: data.bank || "NA",
      mid: data.merchant_id || "NA",
      refundAmt: convertToRupees(data.amount_refunded || 0),
      baseAmount: convertToRupees(data.base_amount || 0),
      international: data.international || false,
      captured: data.captured || false,
      description: data.description || "NA",
      cardId: data.card_id || "NA",
      wallet: data.wallet || "NA",
      vpa: data.vpa || "NA",
      fee: convertToRupees(data.fee || 0),
      tax: convertToRupees(data.tax || 0),
      errorCode: data.error_code || "NA",
      errorDescription: data.error_description || "NA",
      errorSource: data.error_source || "NA",
      errorStep: data.error_step || "NA",
      errorReason: data.error_reason || "NA",
      acquirerData: {
        rrn: data.acquirer_data?.rrn || "NA",
      },
      upi: {
        payer_account_type: data.upi?.payer_account_type || "NA",
        flow: data.upi?.flow || "NA",
        vpa: data.upi?.vpa || "NA",
      },
      invoiceId: data.invoice_id || "NA",
      international: data.international || false,
      amountTransferred: convertToRupees(data.amount_transferred || 0),
      refundStatus: data.refund_status || "NA",
      created_at: new Date(data.created_at * 1000).toISOString() || new Date().toISOString(),
    });

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
