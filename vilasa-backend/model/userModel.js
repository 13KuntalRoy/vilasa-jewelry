const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * Artificial Jewelry User Schema
 * Represents artificial jewelry users in the e-commerce system.
 * Author: Kuntal Roy
 * Vilasa confidential
 */
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
      required: [true, "Please enter your name"],
      trim: true, // Remove leading and trailing spaces
      maxLength: [30, "Name cannot exceed 30 characters"],
      minLength: [4, "Name should have at least 4 characters"],
    },
    // User's email
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please enter a valid email"],
    },
    // User's gender
    gender: {
      type: String,
      enum: ["male", "female", "other",""],
      required: ["Please enter your gender"],
    },
    // User's password
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minLength: [8, "Password should have at least 8 characters"],
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
      enum: ["user", "admin"],
      default: "user",
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

// Hash password before saving to database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    return next(error);
  }
});

// Generate JWT token for authentication
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d', // Default to 1 day
  });

  return token;
};

// Compare entered password with stored hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + (process.env.RESET_PASSWORD_EXPIRE || 15 * 60 * 1000); // Default to 15 minutes

  return resetToken;
};

// Generate and hash password reset token
userSchema.methods.getVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString("hex");
  this.verificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");
  this.verificationTokenExpires = Date.now() + (process.env.VERIFICATION_TOKEN_EXPIRE || 24 * 3600 * 1000); // Default to 24 hours
  return verificationToken; // Return the unhashed token for sending in the email
};


// Define User model
const User = mongoose.model("User", userSchema);

module.exports = User;
