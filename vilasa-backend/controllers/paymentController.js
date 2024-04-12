const asyncWrapper = require("../middleware/asyncErrorHandler");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const paytm = require("paytmchecksum");
const https = require("https");
const Payment = require("../model/paymentModel");
const ErrorHandler = require("../utils/errorHandler");
const { v4: uuidv4 } = require("uuid");
const Razorpay = require("razorpay");

/**
 * Initialize Razorpay instance
 */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Process payment using Stripe
 * @route   POST /api/payments/stripe
 * @access  Public
 * @param   {number} amount - The payment amount
 * @param   {string} email - Email associated with payment
 * @param   {string} phoneNo - Phone number associated with payment
 */
exports.processStripePayment = asyncWrapper(async (req, res, next) => {
  const { amount, email, phoneNo } = req.body;

  const myPayment = await stripe.paymentIntents.create({
    amount: amount,
    currency: "inr",
    metadata: {
      company: "Vilasa",
    },
  });

  res.status(200).json({
    success: true,
    client_secret: myPayment.client_secret,
  });
});


/**
* @desc    Handle Razorpay webhook response
* @route   POST /api/payments/razorpay/webhook
* @access  Public
*/
exports.razorpayWebhook = asyncWrapper(async (req, res, next) => {
 const { payload } = req.body;

 // Verify the webhook signature using Razorpay's validateWebhookSignature method
 const isWebhookValid = razorpay.validateWebhookSignature(
   req.headers["x-razorpay-signature"], // Signature from request header
   JSON.stringify(payload), // Payload data converted to JSON string
   process.env.RAZORPAY_WEBHOOK_SECRET // Your Razorpay webhook secret
 );

 // If the webhook signature is invalid, return a bad request error
 if (!isWebhookValid) {
   return next(new ErrorHandler("Invalid Webhook Signature", 400));
 }

 const { entity } = payload; // Extract the payment entity from the payload

 try {
   // Save the payment details to the database using the addPayment function
   await addPayment(entity);

   // Handle the payment status based on the 'entity' data received from Razorpay

   // Respond with status 200 OK to Razorpay
   res.status(200).send("Webhook Received");
 } catch (error) {
   // If there's an error, handle it appropriately
   console.error("Error processing webhook:", error);
   return next(new ErrorHandler("Internal Server Error", 500));
 }
});

/**
* @desc    Save payment details to the database
* @param   {Object} data - Payment data received from Razorpay webhook
* @returns {Promise<void>}
*/
const addPayment = async (data) => {
 try {
   // Create a new Payment document in the database using the Payment model
   await Payment.create({
     // Map the data fields received from Razorpay to your Payment model fields
     orderId: data.order_id, // Example: Map 'orderId' from 'data.order_id'
     txnId: data.razorpay_payment_id, // Example: Map 'txnId' from 'data.razorpay_payment_id'
     // Map other fields as required
   });
 } catch (error) {
   console.log("Payment Failed!", error);
   // Handle the error appropriately
   throw new Error("Payment Failed");
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
