const mongoose = require("mongoose");

/**
 * Coupon Schema
 * Represents coupons available in the e-commerce system.
 * Author: Kuntal Roy
 */
const couponSchema = new mongoose.Schema({
  // Name of the coupon
  name: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    // Explanation: Name of the coupon. Must be unique and in uppercase format.
    validate: {
      validator: function (v) {
        // Validate coupon name format (uppercase alphanumeric)
        return /^[A-Z0-9]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid name!`,
      // Explanation: Custom validation message for invalid coupon names.
    },
  },
  validateamount:{
    type: Number,
    required: true,
    min: 0,
    // Explanation: Validate coupon amount. Must be a non-negative number.
    validate: {
      validator: function (v) {
        // Validate coupon amount range
        return v >= 0;
      },
      message: (props) => `${props.value} is not a valid coupon amount!`,
      // Explanation: Custom validation message for invalid coupon amounts.
    },
  },
  // Expiry date of the coupon
  expiry: {
    type: Date,
    required: true,
    // Explanation: Expiry date of the coupon. Must be provided.
    validate: {
      validator: function (v) {
        // Validate expiry date (should be in the future)
        return v > Date.now();
      },
      message: (props) => `${props.value} is not a valid expiry date!`,
      // Explanation: Custom validation message for expired coupons.
    },
  },
  // Discount percentage offered by the coupon
  discount: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    // Explanation: Discount percentage offered by the coupon. Must be between 0 and 100.
    validate: {
      validator: function (v) {
        // Validate discount value range
        return v >= 0 && v <= 100;
      },
      message: (props) => `${props.value} is not a valid discount value!`,
      // Explanation: Custom validation message for invalid discount values.
    },
  },
  description:{
    type: String,
    
  }
});

// Export the model
module.exports = mongoose.model("Coupon", couponSchema);
