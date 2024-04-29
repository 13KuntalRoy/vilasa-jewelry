const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema(
  {
    // Unique identifier for the user
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true
    },
    // User's name
    name: {
      type: String,
      required: [true, 'Please enter your name'],
      trim: true, // Remove leading and trailing spaces
      maxLength: [30, 'Name cannot exceed 30 characters'],
      minLength: [4, 'Name should have at least 4 characters'],
    },
    // User's email
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please enter a valid email'],
    },
    // User's gender
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    // User's password
    password: {
      type: String,
      required: [true, 'Please enter your password'],
      minLength: [8, 'Password should have at least 8 characters'],
      select: false, // Hide password by default
    },
    // User's avatar
    avatar: {
      public_id: String,
      url: String,
    },
    // User's role (user or admin)
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    // Token for resetting password
    resetPasswordToken: String,
    // Expiry date for password reset token
    resetPasswordExpire: Date,
    // User's phone number
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          // Custom validation for phone number format
          return /\d{3}-\d{3}-\d{4}/.test(v); // Example format: 123-456-7890
        },
        message: props => `${props.value} is not a valid phone number! Please use the format 123-456-7890.`,
      },
    },
    facebookId: String,
    googleId: String,
  },
  {
    timestamps: true, // Add createdAt and updatedAt fields automatically
    toJSON: {
      virtuals: true, // Include virtual fields in the output
      transform: (doc, ret) => {
        delete ret.password; // Do not include password in the output
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
      },
    },
    toObject: {
      virtuals: true, // Include virtual fields in the output
      transform: (doc, ret) => {
        delete ret.password; // Do not include password in the output
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
      },
    },
  }
);

module.exports = mongoose.model('User', userSchema);
