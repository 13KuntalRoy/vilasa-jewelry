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

// Process payment using Stripe
router.post('/stripe', isAuthenticatedUser, authorizeRoles('user'), processStripePayment);

// Handle Razorpay webhook response
router.post('/razorpay/webhook', razorpayWebhook);

// Get payment status by order ID
router.get('/status/:id', isAuthenticatedUser, authorizeRoles('user'), getPaymentStatus);

// Get all payment information
router.get('/all', isAuthenticatedUser, authorizeRoles('admin'), getAllPayments);

module.exports = router;
