// Import required modules and dependencies
const User = require('../model/userModel'); // Import user model
const asyncErrorHandler = require('../middleware/asyncErrorHandler'); // Import async error handler middleware
const ErrorHandler = require('../utils/errorHandler'); // Import custom error handler
const sendEmail = require('../utils/sendEmail'); // Import send email utility
const crypto = require('crypto'); // Import crypto module for generating hash
const cloudinary = require('cloudinary'); // Import cloudinary for image upload
const sendJWtToken = require('../utils/JwtToken')

// Register a new user
exports.registerUser = asyncErrorHandler(async (req, res, next) => {
    const { name, email, password, gender, avatar } = req.body;

    try {
        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new ErrorHandler('User already exists with this email', 400));
        }

        // Upload avatar to Cloudinary asynchronously
        const avatarUploadPromise = cloudinary.v2.uploader.upload(avatar, {
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
        const verificationUrl = `${req.protocol}://${req.get('host')}/api/vilasa-v1/user/verify-email/${verificationToken}`;
        const message = `Please click on the following link to verify your email address: ${verificationUrl}`;
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
    const { name, email, password, gender, avatar,role } = req.body;

    try {
        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new ErrorHandler('User already exists with this email', 400));
        }

        // Upload avatar to Cloudinary asynchronously
        const avatarUploadPromise = cloudinary.v2.uploader.upload(avatar, {
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
        const verificationUrl = `${req.protocol}://${req.get('host')}/api/vilasa-v1/user/verify-email/${verificationToken}`;
        const message = `Please click on the following link to verify your email address: ${verificationUrl}`;
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


// Verification route
exports.verifyEmail = asyncErrorHandler(async (req, res, next) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ verificationToken: hashedToken, verificationTokenExpires: { $gt: Date.now() } });

    if (!user) {
        return next(new ErrorHandler('Invalid or expired verification token', 400)); // Handle invalid or expired token
    }

    // Mark email as verified
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    try {
        // Save the user data after email verification
        await user.save();
        
        // Respond with success message
        res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        next(new ErrorHandler(error.message, 500)); // Pass any error to error handling middleware with status code 500
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
    const resetUrl = `${req.protocol}://${req.get('host')}/api/vilasa-v1/user/resetpassword/${resetToken}`;

    // Send the password reset email
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

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
        const user = await User.findById(req.user.id);
        if (!user) {
            return next(new ErrorHandler(404, 'User not found.'));
        }

        // Ensure user is authorized to update their own profile
        if (req.user.id !== user.id) {
            return next(new ErrorHandler(403, 'Unauthorized to update this profile.'));
        }

        // Extract fields to update from the request body
        const { name, email } = req.body;
        const fieldsToUpdate = {};
        if (name) fieldsToUpdate.name = name;
        if (email) fieldsToUpdate.email = email;

        // Handle avatar upload if available
        if (req.file) {
            const avatarUpload = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'avatars',
                width: 150,
                crop: 'scale',
            });
            fieldsToUpdate.avatar = {
                public_id: avatarUpload.public_id,
                url: avatarUpload.secure_url,
            };
        }

        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true,
        });

        // Send JWT token in response upon successful update
        sendJWtToken(updatedUser, 200, res);
    } catch (error) {
        // Handle any errors
        console.error(error);
        next(new ErrorHandler(500, 'An error occurred while updating user profile.'));
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
        // Ensure the user is authorized as an admin
        if (req.user.role !== 'admin') {
            return next(new ErrorHandler(403, 'Unauthorized to access this resource.'));
        }

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
        // Ensure the user is authorized as an admin
        if (req.user.role !== 'admin') {
            return next(new ErrorHandler(403, 'Unauthorized to access this resource.'));
        }

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
                    const avatarUpload = await cloudinary.uploader.upload(req.file.path, {
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
