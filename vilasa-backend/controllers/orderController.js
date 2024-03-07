const asyncErrorHandler = require('../middleware/asyncErrorHandler');
const Order = require('../model/orderModel');
const Product = require('../model/productModel');

const sendEmail = require('../utils/sendEmail');

/**
 * @desc    Create a new order
 * @route   POST /api/orders/new
 * @access  Private
 */

exports.newOrder = asyncErrorHandler(async (req, res, next) => {
    const { shippingInfo, orderItems, paymentInfo, totalPrice } = req.body;

    // Validate input data (example validation, adjust as per your needs)
    if (!shippingInfo || !orderItems || !paymentInfo || !totalPrice) {
        return next(new ErrorHandler("Invalid input data", 400));
    }

    // Check payment status
    if (!paymentInfo.success) {
        return next(new ErrorHandler("Payment failed", 400));
    }

    // Check if order with the same paymentInfo already exists
    const orderExist = await Order.exists({ paymentInfo });

    if (orderExist) {
        return next(new ErrorHandler("Order Already Placed", 400));
    }

    // Create the order
    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        totalPrice,
        paidAt: Date.now(),
        user: req.user._id,
    });

    // Send email notification about the new order in parallel
    try {
        const emailPromise = sendEmail({
            email: req.user.email,
            subject: 'New Order Confirmation',
            message: `Dear ${req.user.name}, your order with ID ${order._id} has been successfully placed.`,
        });

        await Promise.all([emailPromise]);
    } catch (error) {
        // Handle email sending error here
        // For example, you could log the error to a logging service like Winston or Sentry
        // logger.error('Failed to send email notification:', error);
        // Or integrate with Sentry:
        // Sentry.captureException(error);
        return next(new ErrorHandler("Failed to send email notification", 500));
    }

    res.status(201).json({
        success: true,
        order,
    });
});


/**
 * @desc    Get details of a single order
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getSingleOrderDetails = asyncErrorHandler(async (req, res, next) => {
    try {
        // Retrieve order details and populate user information
        const order = await Order.findById(req.params.id).populate("user", "name email");

        // Check if order exists
        if (!order) {
            return next(new ErrorHandler("Order Not Found", 404));
        }

        // Respond with order details
        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        // Handle errors
        next(new ErrorHandler(error.message, 500));
    }
});


/**
 * @desc    Get logged in user's orders
 * @route   GET /api/orders/myorders
 * @access  Private
 */
exports.myOrders = asyncErrorHandler(async (req, res, next) => {
    try {
        // Find orders associated with the logged-in user
        const orders = await Order.find({ user: req.user._id });

        // Check if orders exist
        if (!orders || orders.length === 0) {
            return next(new ErrorHandler("Orders Not Found", 404));
        }

        // Respond with user's orders
        res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        // Handle errors
        next(new ErrorHandler(error.message, 500));
    }
});


/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/orders/admin/all
 * @access  Private/Admin
 */
exports.getAllOrders = asyncErrorHandler(async (req, res, next) => {
    try {
        // Retrieve all orders
        const orders = await Order.find();

        // Check if orders exist
        if (!orders || orders.length === 0) {
            return next(new ErrorHandler("Orders Not Found", 404));
        }

        // Calculate total amount
        let totalAmount = 0;
        orders.forEach((order) => {
            totalAmount += order.totalPrice;
        });

        // Respond with all orders and total amount
        res.status(200).json({
            success: true,
            orders,
            totalAmount,
        });
    } catch (error) {
        // Handle errors
        next(new ErrorHandler(error.message, 500));
    }
});


/**
 * @desc    Update order status (Admin)
 * @route   PUT /api/orders/admin/update/:id
 * @access  Private/Admin
 */
exports.updateOrder = asyncErrorHandler(async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return next(new ErrorHandler("Order Not Found", 404));
        }

        if (order.orderStatus === "Delivered") {
            return next(new ErrorHandler("Order Already Delivered", 400));
        }

        // Check if status is being updated to "Shipped"
        if (req.body.status === "Shipped") {
            order.shippedAt = Date.now();
            // Update product stock asynchronously for each order item
            await Promise.all(order.orderItems.map(async (i) => {
                await updateStock(i.product, i.quantity);
            }));
        }

        // Update order status
        order.orderStatus = req.body.status;

        // If status is updated to "Delivered", update deliveredAt timestamp
        if (req.body.status === "Delivered") {
            order.deliveredAt = Date.now();
        }

        // Save the updated order
        await order.save({ validateBeforeSave: false });

        // Respond with success
        res.status(200).json({
            success: true
        });
    } catch (error) {
        // Handle errors
        next(new ErrorHandler(error.message, 500));
    }
});




/**
 * @desc    Delete an order (Admin)
 * @route   DELETE /api/orders/admin/delete/:id
 * @access  Private/Admin
 */
exports.deleteOrder = asyncErrorHandler(async (req, res, next) => {
    try {
        // Find the order by ID
        const order = await Order.findById(req.params.id);

        // Check if the order exists
        if (!order) {
            return next(new ErrorHandler("Order Not Found", 404));
        }

        // Remove the order
        await order.remove();

        // Respond with success message
        res.status(200).json({
            success: true,
        });
    } catch (error) {
        // Handle errors
        next(new ErrorHandler(error.message, 500));
    }
});
/**
 * @desc    Update stock for products in an order
 * @param   {String} id - Product ID
 * @param   {Number} quantity - Quantity to be updated
 * @returns {Promise<void>}
 */
async function updateStock(id, quantity) {
    try {
        const product = await Product.findById(id);

        if (!product) {
            throw new ErrorHandler('Product not found', 404);
        }

        product.stock -= quantity;
        await product.save({ validateBeforeSave: false });
    } catch (error) {
        throw new ErrorHandler(`Failed to update stock: ${error.message}`, 500);
    }
}