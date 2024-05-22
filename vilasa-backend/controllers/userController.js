// Import required modules and dependencies
const User = require('../model/userModel'); // Import user model
const asyncErrorHandler = require('../middleware/asyncErrorHandler'); // Import async error handler middleware
const ErrorHandler = require('../utils/errorHandler'); // Import custom error handler
const sendEmail = require('../utils/sendEmail'); // Import send email utility
const crypto = require('crypto'); // Import crypto module for generating hash
const bcrypt = require("bcryptjs");
const cloudinary = require('cloudinary'); // Import cloudinary for image upload
const sendJWtToken = require('../utils/JwtToken')
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library'); // Import Google OAuth2 client

// Configure Google OAuth2 client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);// Configure Facebook OAuth2 strategy with clientID and clientSecret

exports.googleAuth = asyncErrorHandler(async (req, res) => {
    try {
        const { token: googleToken } = req.body; // Rename 'token' to 'googleToken'

        if (!googleToken) {
            return res.status(400).json({ success: false, message: "Google token is missing" });
        }

        // Verify Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload) {
            return res.status(400).json({ success: false, message: "Invalid Google token" });
        }


        // Check if the required fields are provided
        if (!payload.email || !payload.name) {
            return res.status(400).json({ success: false, message: "Missing required fields in Google profile" });
        }

        // Check if user exists with Google ID
        let user = await User.findOne({ googleId: payload.sub });
        if (!user) {
            // If user doesn't exist, create a new user with Google profile
            user = await User.create({
                name: payload.name,
                email: payload.email,
                googleId: payload.sub,
                password: 'vilasa3456@1234',
                role: 'user',
                emailVerified: true,
            });
        }
        sendJWtToken(user, 200, res);

    } catch (error) {
        console.error("Google authentication failed:", error);
        res.status(500).json({ success: false, message: "Internal server error occurred during Google authentication" });
    }
});

// Register a new user
exports.registerUser = asyncErrorHandler(async (req, res, next) => {
    const { name, email, password, gender } = req.body;
    // Upload avatar to Cloudinary
    console.log(req);
    const avatar = req.files.avatar;

    try {
        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new ErrorHandler('User already exists with this email', 400));
        }

        // Upload avatar to Cloudinary asynchronously
        const avatarUploadPromise = cloudinary.v2.uploader.upload(avatar.tempFilePath, {
            folder: 'avatars',
            width: 150,
            crop: 'scale',
        });

        // Create the new user without saving to database yet
        const newUser = new User({
            name,
            email,
            password,
            gender,
            emailVerified: false, // Set emailVerified to false initially
        });

        // Wait for avatar upload to complete
        const avatarUpload = await avatarUploadPromise;

        // Update user with avatar details
        newUser.avatar = {
            public_id: avatarUpload.public_id,
            url: avatarUpload.secure_url,
        };

        // Generate and save verification token
        const verificationToken = newUser.getVerificationToken();
        await newUser.save();

        // Send verification email to the new user
        const verificationUrl = `${process.env.FRONTEND_URL}verify-email/confirm?token=${verificationToken}`;
        const message = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              animation: fadeIn 0.6s ease-in-out;
            }
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            h1 {
              color: #333333;
              text-align: center;
              font-size: 28px;
              margin-bottom: 20px;
              font-family: 'Segoe Script', cursive;
            }
            p {
              color: #666666;
              line-height: 1.6;
              margin-bottom: 15px;
              font-size: 16px;
            }
            .button {
              display: inline-block;
              background-color: #ffcc00;
              color: #333333;
              text-decoration: none;
              padding: 12px 24px;
              margin-top: 20px;
              transition: background-color 0.3s ease-in-out;
              animation: pulse 1.5s infinite alternate;
              border-radius: 5px;
              font-size: 18px;
            }
            .button:hover {
              background-color: #ffdb4d;
            }
            @keyframes pulse {
              from {
                transform: scale(1);
              }
              to {
                transform: scale(1.1);
              }
            }
            .logo {
              display: block;
              margin: 0 auto;
              width: 150px;
              height: auto;
              animation: fadeInLogo 1s ease-out;
            }
            @keyframes fadeInLogo {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #999999;
              font-size: 14px;
            }
            .footer a {
              color: #007bff;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
        <div class="container">
          <img src="https://image.pngaaa.com/581/811581-small.png" alt="Company Logo" class="logo">
          <h1>Email Verification</h1>
          <p>Hello ${name},</p>
          <p>Welcome to our jewelry site! Thank you for signing up.</p>
          <p>To verify your email address and activate your account, please click the button below:</p>
          <a href="${verificationUrl}" class="button">Verify Email</a>
          <p>If you did not sign up for our platform, please disregard this email.</p>
          <p>Best Regards,</p>
          <p>The Jewelry Team</p>
        </div>
        <div class="footer">
          <p>Need help? <a href="mailto:support@example.com">Contact Us</a></p>
        </div>
        </body>
        </html>`;
        await sendEmail({
            email: newUser.email,
            subject: 'Email Verification',
            message
        });

        // Respond with success message
        res.status(201).json({
            success: true,
            message: 'Account created successfully. Please verify your email address.',
        });
    } catch (error) {
        next(new ErrorHandler(error.message, 500)); // Pass any error to error handling middleware with status code 500
    }
});


// Register a new user
exports.registerAdmin = asyncErrorHandler(async (req, res, next) => {
    const { name, email, password, gender, role } = req.body;
    // Upload avatar to Cloudinary
    console.log(req);
    const avatar = req.files.avatar;


    try {
        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new ErrorHandler('User already exists with this email', 400));
        }

        // Upload avatar to Cloudinary asynchronously
        const avatarUploadPromise = cloudinary.v2.uploader.upload(avatar.tempFilePath, {
            folder: 'avatars',
            width: 150,
            crop: 'scale',
        });

        // Create the new user without saving to database yet
        const newUser = new User({
            name,
            email,
            password,
            gender,
            role,
            emailVerified: false, // Set emailVerified to false initially
        });

        // Wait for avatar upload to complete
        const avatarUpload = await avatarUploadPromise;

        // Update user with avatar details
        newUser.avatar = {
            public_id: avatarUpload.public_id,
            url: avatarUpload.secure_url,
        };

        // Generate and save verification token
        const verificationToken = newUser.getVerificationToken();
        await newUser.save();

        // Send verification email to the new user
        // const verificationUrl = `${req.protocol}://${req.get('host')}/api/vilasa-v1/user/verify-email/${verificationToken}`;
        const verificationUrl = `${process.env.FRONTEND_URL}verify-email/confirm?token=${verificationToken}`;
        const message =`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              animation: fadeIn 0.6s ease-in-out;
            }
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            h1 {
              color: #333333;
              text-align: center;
              font-size: 28px;
              margin-bottom: 20px;
              font-family: 'Segoe Script', cursive;
            }
            p {
              color: #666666;
              line-height: 1.6;
              margin-bottom: 15px;
              font-size: 16px;
            }
            .button {
              display: inline-block;
              background-color: #ffcc00;
              color: #333333;
              text-decoration: none;
              padding: 12px 24px;
              margin-top: 20px;
              transition: background-color 0.3s ease-in-out;
              animation: pulse 1.5s infinite alternate;
              border-radius: 5px;
              font-size: 18px;
            }
            .button:hover {
              background-color: #ffdb4d;
            }
            @keyframes pulse {
              from {
                transform: scale(1);
              }
              to {
                transform: scale(1.1);
              }
            }
            .logo {
              display: block;
              margin: 0 auto;
              width: 150px;
              height: auto;
              animation: fadeInLogo 1s ease-out;
            }
            @keyframes fadeInLogo {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #999999;
              font-size: 14px;
            }
            .footer a {
              color: #007bff;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
        <div class="container">
          <img src="https://image.pngaaa.com/581/811581-small.png" alt="Company Logo" class="logo">
          <h1>Email Verification</h1>
          <p>Hello ${name},</p>
          <p>Welcome to our jewelry site! Thank you for signing up.</p>
          <p>To verify your email address and activate your account, please click the button below:</p>
          <a href="${verificationUrl}" class="button">Verify Email</a>
          <p>If you did not sign up for our platform, please disregard this email.</p>
          <p>Additionally, please note that this account was created from our admin site. For security reasons, we recommend changing your password after logging in.</p>
          <p>Best Regards,</p>
          <p>The Jewelry Team</p>
        </div>
        <div class="footer">
          <p>Need help? <a href="mailto:support@example.com">Contact Us</a></p>
        </div>
        </body>
        </html>`;        
        await sendEmail({
            email: newUser.email,
            subject: `Email Verification-Password ( ${password} ) `,
            message
        });

        // Respond with success message
        res.status(201).json({
            success: true,
            message: 'Account created successfully. Please verify your email address.',
        });
    } catch (error) {
        next(new ErrorHandler(error.message, 500)); // Pass any error to error handling middleware with status code 500
    }
});


// Verification route
exports.verifyEmail = asyncErrorHandler(async (req, res, next) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ verificationToken: hashedToken, verificationTokenExpires: { $gt: Date.now() } });

    if (!user) {
        return next(new ErrorHandler('Invalid or expired verification token', 400)); // Handle invalid or expired token
    }

    if (user.emailVerified) {
        return res.status(400).json({ success: false, message: 'Email already verified' });
    }
    else {
        // Mark email as verified
        user.emailVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;

        try {
            // Save the user data after email verification
            await user.save();

            // Respond with success message
            return res.status(200).json({ success: true, message: 'Email verified successfully' });
        } catch (error) {
            next(new ErrorHandler(error.message, 500)); // Pass any error to error handling middleware with status code 500
        }
    }
});

// Login user
exports.loginUser = asyncErrorHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        return next(new ErrorHandler('Please provide email and password', 400));
    }

    // Check if the user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
        return next(new ErrorHandler('Invalid email or password', 401));
    }

    // Send JWT token to the client
    sendJWtToken(user, 200, res);
});

// Logout user
exports.logoutUser = asyncErrorHandler(async (req, res, next) => {
    // Clear the JWT cookie
    // Generate a new random token
    const newToken = crypto.randomBytes(32).toString('hex');
    res.cookie('token', newToken, {
        expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds
        httpOnly: true,
    });
    res.clearCookie('refreshToken');

    // Send response
    res.status(200).json({
        success: true,
        message: 'User logged out successfully',
    });
});



// Forgot password - Send reset token
exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    // Check if user exists with provided email
    if (!user) {
        return next(new ErrorHandler('User not found with this email', 404));
    }

    // Generate and hash the reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    // Create the reset URL
    // const resetUrl = `${req.protocol}://${req.get('host')}/api/vilasa-v1/user/resetpassword/${resetToken}`;
    const resetUrl = `${process.env.FRONTEND_URL}resetpassword?token=${resetToken}`;
    // Send the password reset email
    const message = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          animation: fadeIn 0.6s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        h1 {
          color: #333333;
          text-align: center;
          font-size: 28px;
          margin-bottom: 20px;
          font-family: 'Segoe Script', cursive;
        }
        p {
          color: #666666;
          line-height: 1.6;
          margin-bottom: 15px;
          font-size: 16px;
        }
        .button {
          display: inline-block;
          background-color: #007bff;
          color: #ffffff;
          text-decoration: none;
          padding: 12px 24px;
          margin-top: 20px;
          transition: background-color 0.3s ease-in-out;
          animation: pulse 1.5s infinite alternate;
          border-radius: 5px;
          font-size: 18px;
        }
        .button:hover {
          background-color: #0056b3;
        }
        @keyframes pulse {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.1);
          }
        }
        .logo {
          display: block;
          margin: 0 auto;
          width: 150px;
          height: auto;
          animation: fadeInLogo 1s ease-out;
        }
        @keyframes fadeInLogo {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #999999;
          font-size: 14px;
        }
        .footer a {
          color: #007bff;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
    <div class="container">
      <img src="https://image.pngaaa.com/581/811581-small.png" alt="Company Logo" class="logo">
      <h1>Password Reset</h1>
      <p>This email is being sent to you because a password reset request has been made.</p>
      <p>To proceed with the password reset, please click the button below:</p>
      <a href="${resetUrl}" class="button">Reset Password</a>
      <p>If you did not initiate this request, you may ignore this email.</p>
      <p>Best Regards,</p>
      <p>The Team</p>
    </div>
    <div class="footer">
      <p>If you need further assistance, please <a href="mailto:support@example.com">contact us</a>.</p>
    </div>
    </body>
    </html>`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password reset token',
            message,
        });

        // Send response
        res.status(200).json({
            success: true,
            message: 'Password reset token sent to email',
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        // Handle email sending error
        return next(new ErrorHandler('Email could not be sent', 500));
    }
});

// Reset password
exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // Find user by reset token
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ErrorHandler('Invalid reset token', 400));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send response
    res.status(200).json({
        success: true,
        message: 'Password updated successfully',
    });
});

// Update user profile
exports.updateUserProfile = asyncErrorHandler(async (req, res, next) => {
    try {
        // Find the user by ID
        // console.log("user",req.user.id);
        // console.log(req.files);
        const user = await User.findById(req.user.id);
        const avatar = req.files.avatar
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Ensure user is authorized to update their own profile
        if (req.user.id !== user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized to update this profile.' });
        }

        // Extract fields to update from the request body
        const { name, email, gender, phone,address,password } = req.body;


        const fieldsToUpdate = {};
        if (name) fieldsToUpdate.name = name;
        if (email) fieldsToUpdate.email = email;
        if (gender) fieldsToUpdate.gender = gender;
        if (phone) fieldsToUpdate.phone = phone;
        if (address) fieldsToUpdate.phone = address;


        // Handle avatar upload if available
        if (req.files) {
            // Check if the user has an existing avatar
            if (user.avatar && user.avatar.public_id) {
                // Delete the old avatar picture from Cloudinary
                await cloudinary.v2.uploader.destroy(user.avatar.public_id);
            }
            // console.log("passsssssssssssssssssss");
            // Upload the new avatar picture
            const avatarUpload = await cloudinary.v2.uploader.upload(avatar.tempFilePath, {
                folder: 'avatars',
                width: 150,
                crop: 'scale',
            });
            // console.log("okkkkkkkkkkkkkkkk",avatarUpload.public_id);
            fieldsToUpdate.avatar = {
                public_id: avatarUpload.public_id,
                url: avatarUpload.secure_url,
            };
        }
        // console.log("hhhhhhhhhhhhhhhhhhhh");

        // Handle password update
        if (password) {
            // Generate a new salt only if the password has changed
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            fieldsToUpdate.password = hashedPassword;
        }

        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true,
        });

        // Send success response with updated user data
        sendJWtToken(updatedUser, 200, res);
    } catch (error) {
        // Handle any errors
        // console.error(error);
        return res.status(500).json({ success: false, message: 'An error occurred while updating user profile.' });
    }
});




// Admin operations

// Get all users (Admin)
exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
    try {
        // Ensure the user is authorized as an admin
        if (req.user.role !== 'admin') {
            return next(new ErrorHandler(403, 'Unauthorized to access this resource.'));
        }

        // Fetch all users from the database
        const users = await User.find();

        // Send response with user data
        res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        // Handle any errors
        console.error(error);
        next(new ErrorHandler(500, 'An error occurred while fetching users.'));
    }
});

// Get single user by ID (Admin)
exports.getUserById = asyncErrorHandler(async (req, res, next) => {
    try {

        // Find user by ID
        const user = await User.findById(req.params.id);

        // Check if user exists
        if (!user) {
            return next(new ErrorHandler(`User not found with id ${req.params.id}`, 404));
        }

        // Send JWT token response
        sendJWtToken(user, 200, res);
    } catch (error) {
        // Handle any errors
        console.error(error);
        next(new ErrorHandler(500, 'An error occurred while fetching user by ID.'));
    }
});

exports.updateUserById = asyncErrorHandler(async (req, res, next) => {
    try {

        // Find user by ID
        const user = await User.findById(req.params.id);

        // Check if user exists
        if (!user) {
            return next(new ErrorHandler(`User not found with id ${req.params.id}`, 404));
        }

        // Update user information based on request body
        for (const key in req.body) {
            if (req.body.hasOwnProperty(key)) {
                // If updating the avatar and a file is provided, upload and update the avatar
                if (key === 'avatar' && req.file) {
                    const avatarUpload = await cloudinary.uploader.upload(req.file.avatar.tempFilePath, {
                        folder: 'avatars',
                        width: 150,
                        crop: 'scale',
                    });

                    user.avatar = {
                        public_id: avatarUpload.public_id,
                        url: avatarUpload.secure_url,
                    };
                } else {
                    // Otherwise, update other user fields
                    user[key] = req.body[key];
                }
            }
        }

        // Save the updated user
        await user.save();

        // Respond with success message
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user,
        });
    } catch (error) {
        // Handle any errors
        console.error(error);
        next(new ErrorHandler(500, 'An error occurred while updating user information.'));
    }
});

// Delete user by ID (Admin)
exports.deleteUserById = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    // Check if user exists
    if (!user) {
        return next(new ErrorHandler(`User not found with id ${req.params.id}`, 404));
    }

    // Remove user
    await user.remove();

    // Send response
    res.status(200).json({
        success: true,
        message: 'User deleted successfully',
    });
});
// Controller to refresh access token using refresh token
exports.refreshToken = asyncErrorHandler(async (req, res, next) => {
    // Extract the refresh token from the request body or headers
    // const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
    const refreshTokenFromBody = req.body.refreshToken;
    console.log(refreshTokenFromBody);
    // Check if refresh token is provided
    if (!refreshTokenFromBody) {
        return next(new ErrorHandler('Refresh token is missing', 400));
    }

    try {
        const decoded = jwt.verify(refreshTokenFromBody, process.env.REFRESH_TOKEN_SECRET);
        // Check if the refresh token belongs to a valid user
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new ErrorHandler('Invalid refresh token', 401));
        }
        sendJWtToken(user, 200, res)
        // Send the new access token to the client

    } catch (error) {
        // Handle token verification or user lookup errors
        return next(new ErrorHandler('Invalid refresh token', 401));
    }
});
