const express = require('express');
const rateLimit = require("express-rate-limit");
const router = express.Router();
const {
    registerUser,
    registerAdmin,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
    updateUserProfile,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById,
    verifyEmail,
    googleAuth,
    // facebookAuth,
    refreshToken
} = require('../controllers/userController');

// Rate limit configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many requests from this IP, please try again later"
});

const {isAuthenticatedUser,authorizeRoles} = require('../middleware/auth')

// Routes for user authentication and management
router.route('/register')
    .post(registerUser); // Register a new user
router.route('/register/admin')
      .post(registerAdmin)
    
router.route('/verify-email/:token')
    .get(verifyEmail);

router.route('/login')
    .post(loginUser); // Login user

router.route('/logout')
    .get(logoutUser); // Logout user

router.route('/forgotpassword',limiter)
    .post(forgotPassword); // Forgot password - Send reset token

router.route('/resetpassword/:token')
    .put(resetPassword); // Reset password

router.route('/updateprofile')
    .put(isAuthenticatedUser, updateUserProfile); // Update user profile

// Routes for admin operations
router.route('/users')
    .get(isAuthenticatedUser, authorizeRoles('admin'), getAllUsers); // Get all users (Admin)

router.route('/users/:id')
    .get(isAuthenticatedUser, authorizeRoles('admin'), getUserById) // Get single user by ID (Admin)
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateUserById) // Update user details by ID (Admin)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteUserById); // Delete user by ID (Admin)
// Google OAuth2 authentication route
router.route('/google').post(googleAuth);

// // Facebook OAuth2 authentication route
// router.route('/facebook').post( facebookAuth);

router.route('/refresh-token').post(refreshToken);

module.exports = router;
