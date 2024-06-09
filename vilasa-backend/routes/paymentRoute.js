const express = require('express');
const router = express.Router();
const {
    processStripePayment,
    razorpayWebhook,
    getPaymentStatus,
    getAllPayments
} = require('../controllers/paymentController');
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

// Routes for payment processing
router.route('/stripe')
    .post(isAuthenticatedUser, authorizeRoles('user'), processStripePayment); // Process payment using Stripe
router.route('/razorpay/webhook')
    .post(isAuthenticatedUser,authorizeRoles('user'),razorpayWebhook); // Handle Razorpay webhook response

router.route('/status/:id')
    .get(isAuthenticatedUser, authorizeRoles('user'), getPaymentStatus); // Get payment status by order ID
router.route('/getpaymentsinfo').get(getAllPayments);
module.exports = router;
