/**
 * Send JWT token to the client in a cookie and as a response
 * @param {Object} user - User data
 * @param {number} statusCode - HTTP status code
 * @param {Object} response - Express response object
 * @author Kuntal Roy
 */ 
const sendJWtToken = (user, statusCode, response) => {
    // Generate JWT token
    const {token,refreshToken} = user.generateAuthToken();

    // Cookie options
    const options = {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000), // Cookie expiration time
        httpOnly: true, // Cookie is accessible only through HTTP(S) headers
    };
    
    // Send token in a cookie and as a response
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
