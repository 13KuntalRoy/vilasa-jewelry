const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  razorpayWebhook,
  getPaymentStatus,
  getAllPayments
} = require('../controllers/paymentController');
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

// Routes for payment processing

router.route('/razorpay/create-order')
  .post(createRazorpayOrder);

router.route('/razorpay/webhook')
  .post(razorpayWebhook);

router.route('/status/:id')
  .get(isAuthenticatedUser, getPaymentStatus);



router.route('/all')
  .get(isAuthenticatedUser, authorizeRoles('admin'), getAllPayments);

module.exports = router;
