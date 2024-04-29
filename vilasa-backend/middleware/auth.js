// Import required modules
const asyncWrapper = require("../middleware/asyncErrorHandler");
const userModel = require("../model/userModel");
const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");

/**
 * Middleware to authenticate users
 * @function isAuthenticatedUser
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * @throws {ErrorHandler} If authentication fails
 * @author Kuntal Roy
 */
// exports.isAuthenticatedUser = asyncWrapper(async (req, res, next) => {
//   // Extract token from request cookies
//   const token = req.cookies.token;

//   // Check if token exists
//   if (!token) {
//     // If token doesn't exist, return authentication error
//     return next(new ErrorHandler("Please Login to access this resource", 401));
//   }

//   try {
//     // Verify the token using JWT and secret key
//     const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

//     // Find user by ID extracted from decoded token
//     const user = await userModel.findById(decodedToken.id).select("-password");

//     // If user doesn't exist, return authentication error
//     if (!user) {
//       return next(new ErrorHandler("Invalid token. Please login again.", 401));
//     }

//     // Store user information in request object for further use
//     req.user = user;

//     // Move to the next middleware
//     next();
//   } catch (error) {
//     // If any error occurs during token verification, return authentication error
//     return next(new ErrorHandler("Invalid token. Please login again.", 401));
//   }
// });
exports.isAuthenticatedUser = asyncWrapper(async (req, res, next) => {
  // Extract token from request headers
  const authorizationHeader = req.headers.authorization;

  // Check if authorization header exists
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer")) {
    // If authorization header doesn't exist or doesn't start with "Bearer", return authentication error
    return next(new ErrorHandler("Please provide a valid token", 401));
  }

  try {
    // Extract token from authorization header
    const token = authorizationHeader.split(" ")[1];

    // Verify the token using JWT and secret key
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID extracted from decoded token
    const user = await userModel.findById(decodedToken.id).select("-password");

    // If user doesn't exist, return authentication error
    if (!user) {
      return next(new ErrorHandler("Invalid token. Please login again.", 401));
    }

    // Store user information in request object for further use
    req.user = user;

    // Move to the next middleware
    next();
  } catch (error) {
    // If any error occurs during token verification, return authentication error
    return next(new ErrorHandler("Invalid token. Please login again.", 401));
  }
});


/**
 * Middleware to authorize user roles
 * @function authorizeRoles
 * @param {...string} roles - List of roles allowed to access the resource
 * @returns {Function} Express middleware function
 * @throws {ErrorHandler} If user's role is not authorized
 * @author Kuntal Roy
 */
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Check if user's role is included in the authorized roles
    if (!roles.includes(req.user.role)) {
      // If user's role is not authorized, return authorization error
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resource`,
          403
        )
      );
    }

    // Move to the next middleware
    next();
  };
};