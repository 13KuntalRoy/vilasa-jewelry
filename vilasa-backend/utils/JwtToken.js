const jwt = require("jsonwebtoken");
/**
 * Send JWT token to the client in a cookie and as a response
 * @param {Object} user - User data
 * @param {number} statusCode - HTTP status code
 * @param {Object} response - Express response object
 * @author Kuntal Roy
 */
// Function to generate access and refresh tokens
function generateTokens(user) {
    const token = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.JWT_EXPIRE || '1d' });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET);
    return { token, refreshToken };
}

// Function to send JWT token to the client in a cookie and as a response
const sendJWtToken = (user, statusCode, response) => {
    // Generate tokens
    const { token, refreshToken } = generateTokens(user);
    
    // Cookie options
    const options = {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000), // Cookie expiration time
        httpOnly: true, // Cookie is accessible only through HTTP(S) headers
    };
    
    // Send tokens in a cookie and as a response
    response.status(statusCode)
        .cookie("token", token, options)
        .cookie("refreshToken", refreshToken, options)
        .json({
            success: true,
            user,
            token,
        });
};

module.exports = sendJWtToken;
