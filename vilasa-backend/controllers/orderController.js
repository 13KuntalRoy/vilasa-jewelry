const asyncErrorHandler = require('../middleware/asyncErrorHandler');
const Order = require('../model/orderModel');
const Coupon = require('../model/Coupon');
const Product = require('../model/productModel');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/sendEmail');

exports.applyCoupons = async (req, res, next) => {
    try {
        const { selectedProducts, couponNames } = req.body;

        if (!selectedProducts || selectedProducts.length === 0) {
            throw new ErrorHandler('Selected products are required', 400);
        }

        if (!couponNames) {
            throw new ErrorHandler('Coupon names are required', 400);
        }

        const couponNameArray = couponNames.split('.');
        if (couponNameArray.length === 0) {
            throw new ErrorHandler('Invalid coupon names provided', 400);
        }

        const coupons = await Coupon.find({ name: { $in: couponNameArray } });
        console.log(`${coupons} + Moye mmoyee`);

        if (coupons.length === 0) {
            throw new ErrorHandler('No valid coupons found', 404);
        }

        const productsWithCoupons = await Promise.all(selectedProducts.map(async (selectedProduct) => {
            const product = await Product.findById(selectedProduct.productId).populate('coupons');

            if (!product) {
                return null;
            }

            let discountPrice = product.price;
            let appliedCouponIds = [];

            const productCouponIds = product.coupons.map(coupon => coupon._id.toString());

            coupons.forEach(coupon => {
                if (productCouponIds.includes(coupon._id.toString())) {
                    discountPrice -= (product.price * coupon.discount) / 100;
                    appliedCouponIds.push(coupon._id);
                }
            });

            return {
                name: product.name,
                price: product.price,
                quantity: selectedProduct.quantity,
                discountPrice,
                couponIds: appliedCouponIds,
                productId: product._id
            };
        }));

        const filteredProducts = productsWithCoupons.filter(Boolean);

        if (filteredProducts.length === 0) {
            throw new ErrorHandler('No valid products found for the provided coupons', 404);
        }

        res.status(200).json({
            success: true,
            orderItems: filteredProducts
        });
    } catch (error) {
        next(error);
    }
};
// /**
//  * @desc    Create a new order
//  * @route   POST /api/orders/new
//  * @access  Private
//  */
// exports.newOrder = asyncErrorHandler(async (req, res, next) => {
//     const { shippingInfo, orderItems, paymentInfo, totalPrice } = req.body;

//     // Validate input data
//     if (!shippingInfo || !orderItems || !paymentInfo || !totalPrice) {
//         return next(new ErrorHandler("Invalid input data", 422)); // 422 for Unprocessable Entity
//     }
//     console.log("KKKKKKKKKK",paymentInfo);

//     // Check payment status
//     if (!paymentInfo.status) {
//         return next(new ErrorHandler("Payment failed", 400));
//     }

//     // Check if order with the same paymentInfo already exists
//     const orderExist = await Order.exists({ paymentInfo });

//     if (orderExist) {
//         return next(new ErrorHandler("Order Already Placed", 400));
//     }
//     console.log("Moye moye");

//     // Create the order
//     const order = await Order.create({
//         shippingInfo,
//         orderItems,
//         paymentInfo,
//         totalPrice,
//         paidAt: Date.now(),
//         user: req.user._id,
//     });
//     console.log("lpppppppplp");

//     // Update product stock asynchronously for each order item
//     await Promise.all(order.orderItems.map(async (item) => {
//         await updateStock(item.productId, item.quantity);
//         await updatePiecesSold(item.productId, item.quantity); // Update piecesSold count
//     }));

//     // Send email notification about the new order in parallel
//     try {
//         await sendOrderConfirmationEmail(req.user.email, order._id, req.user.name);
//     } catch (error) {
//         return next(new ErrorHandler("Failed to send email notification", 500)); // 500 for Internal Server Error
//     }

//     res.status(201).json({
//         success: true,
//         order,
//     });
// });
/**
 * @desc    Create a new order
 * @route   POST /api/orders/new
 * @access  Private
 */
/**
 * @desc    Create a new order
 * @route   POST /api/orders/new
 * @access  Private
 */
exports.newOrder = asyncErrorHandler(async (req, res, next) => {
    const { shippingInfo, orderItems, paymentInfo, totalPrice, discountedPrice, itemsPrice, taxPrice,shippingPrice } = req.body;

    // Validate input data
    if (!shippingInfo || !orderItems || !paymentInfo || !totalPrice) {
        return next(new ErrorHandler("Invalid input data", 422)); // 422 for Unprocessable Entity
    }

    // Check payment status
    if (!paymentInfo.status) {
        return next(new ErrorHandler("Payment failed", 400));
    }

    // Check if order with the same paymentInfo already exists
    const orderExist = await Order.exists({ paymentInfo });

    if (orderExist) {
        return next(new ErrorHandler("Order Already Placed", 400));
    }

    // Validate each product's coupon ID and discounted price
    for (const item of orderItems) {
        const product = await Product.findById(item.productId);
        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        // Verify if the coupon is applicable to the product
        if (item.couponId !== product.couponId) {
            return next(new ErrorHandler("Invalid coupon applied for product", 400));
        }

        // Calculate the discounted price for the product if applicable
        if (item.discountedPrice) {
            const calculatedDiscountedPrice = await calculateDiscountedPrice(item.couponId, product.price);
            if (item.discountedPrice !== calculatedDiscountedPrice) {
                return next(new ErrorHandler("Invalid discounted price for product", 400));
            }
        }
    }

    // Create the order
    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        totalPrice,
        discountedPrice,
        itemsPrice,
        taxPrice,
        shippingPrice,
        paid: true,
        paidAt: Date.now(),
        user: req.user._id,
    });

    // Update product stock asynchronously for each order item
    await Promise.all(order.orderItems.map(async (item) => {
        await updateStock(item.productId, item.quantity);
        await updatePiecesSold(item.productId, item.quantity); // Update piecesSold count
    }));

    // Send email notification about the new order in parallel
    try {
        await sendOrderConfirmationEmail(req.user.email, order._id, req.user.name);
    } catch (error) {
        return next(new ErrorHandler("Failed to send email notification", 500)); // 500 for Internal Server Error
    }

    res.status(201).json({
        success: true,
        order,
    });
});
/**
 * Check if the coupon is applicable to the product
 * @param {String} couponId - ID of the coupon provided by the user
 * @param {String} productCouponId - ID of the coupon associated with the product
 * @returns {Boolean} true if the coupon is applicable, false otherwise
 */
async function isCouponApplicable(couponId, productCouponId) {
    return couponId === productCouponId;
}

/**
 * Calculate discounted price for a product based on applied coupon
 * @param {String} couponId - ID of the coupon applied to the product
 * @param {Number} productPrice - Original price of the product
 * @returns {Number} discounted price
 */
async function calculateDiscountedPrice(couponId, productPrice) {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
        throw new ErrorHandler("Coupon not found", 404);
    }
    // Apply discount based on coupon type (percentage)
    return productPrice - (coupon.amount / 100) * productPrice;
}

/**
 * Calculate discounted price for a product based on applied coupon
 * @param {String} couponId - ID of the coupon applied to the product
 * @param {Number} productPrice - Original price of the product
 * @returns {Number} discounted price
 */

// Function to update piecesSold count for a product
async function updatePiecesSold(productId, quantity) {
    await Product.findByIdAndUpdate(productId, { $inc: { Sold: quantity } });
}

// Function to send order confirmation email
async function sendOrderConfirmationEmail(email, orderId, userName) {
    await sendEmail({
        email: email,
        subject: 'New Order Confirmation',
        message: `Dear ${userName}, your order with ID ${orderId} has been successfully placed.`,
    });
}
/**
 * @desc    Initiate a return for an order
 * @route   POST /api/orders/:id/return
 * @access  Private
 */
exports.initiateReturn = asyncErrorHandler(async (req, res, next) => {
    const { returnReason } = req.body;

    // Validate input data
    if (!returnReason) {
        return next(new ErrorHandler("Return reason is required", 422)); // 422 for Unprocessable Entity
    }

    const order = await Order.findById(req.params.id);

    // Check if the order exists
    if (!order) {
        return next(new ErrorHandler("Order not found", 404));
    }

    // Check if the order is associated with the logged-in user
    if (order.user.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized to initiate return for this order", 401));
    }

    // Check if the order has already been delivered
    if (order.orderStatus !== "Delivered") {
        return next(new ErrorHandler("Cannot initiate return for undelivered order", 400));
    }

    // Check if a return has already been initiated for this order
    if (order.returnInfo) {
        return next(new ErrorHandler("Return already initiated for this order", 400));
    }

    // Create return information
    order.returnInfo = {
        returnReason,
        returnStatus: "Pending",
        returnRequestedAt: Date.now()
    };

    await order.save();

    res.status(200).json({
        success: true,
        message: "Return initiated successfully",
        order,
    });
});

// Function to send return confirmation email
async function sendReturnConfirmationEmail(email, orderId, userName) {
    await sendEmail({
        email: email,
        subject: 'Return Initiated Confirmation',
        message: `Dear ${userName}, your return request for order with ID ${orderId} has been successfully initiated.`,
    });
}
/**
 * @desc    Get details of a single order
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getSingleOrderDetails = asyncErrorHandler(async (req, res, next) => {
    try {
        // Retrieve order details and populate user information
        const order = await Order.findById(req.params.id)
            .populate("user")
            .populate({ path: "orderItems.productId", })

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
        console.log("okkkkk");
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
/**
 * @desc    Update return status for an order
 * @route   PUT /api/orders/:id/return/update
 * @access  Private/Admin
 */
exports.updateReturnStatus = asyncErrorHandler(async (req, res, next) => {
    const { returnStatus, paymentStatus } = req.body;

    // Validate input data
    if (!returnStatus || !paymentStatus) {
        return next(new ErrorHandler("Return status and payment status are required", 422)); // 422 for Unprocessable Entity
    }

    // Find the order by ID
    const order = await Order.findById(req.params.id);

    // Check if the order exists
    if (!order) {
        return next(new ErrorHandler("Order not found", 404));
    }

    // Update return status if the order has a return initiated
    if (!order.returnInfo) {
        return next(new ErrorHandler("No return initiated for this order", 400));
    }
    console.log("okkkkkk");
    // Update return status
    order.returnInfo.returnStatus = returnStatus;
    console.log("okkk2");

    // If return status is updated to "Approved" or "Rejected", update the order status accordingly
    if (returnStatus === "Approved") {
        order.orderStatus = "Return Approved";
    } else if (returnStatus === "Rejected") {
        order.orderStatus = "Return Rejected";
    }

    // Update payment status
    console.log(paymentStatus);
    order.paymentInfo.status = paymentStatus;

    await order.save();

    res.status(200).json({
        success: true,
        message: "Return status and payment status updated successfully",
        order,
    });
});

/**
 * @desc    Process return for an order
 * @route   PUT /api/orders/:id/return/process
 * @access  Private/Admin
 */
exports.processReturn = asyncErrorHandler(async (req, res, next) => {
    const { returnStatus, paymentStatus } = req.body;

    // Validate input data
    if (!returnStatus || !paymentStatus) {
        throw new ErrorHandler("Return status and payment status are required", 422); // 422 for Unprocessable Entity
    }

    // Find the order by ID
    const order = await Order.findById(req.params.id);

    // Check if the order exists
    if (!order) {
        throw new ErrorHandler("Order not found", 404);
    }

    // Check if a return has been initiated for this order
    if (!order.returnInfo) {
        throw new ErrorHandler("No return initiated for this order", 400);
    }

    // Update return status
    order.returnInfo.returnStatus = returnStatus;

    // If return status is updated to "Processed", update the order status accordingly
    if (returnStatus === "Processed") {
        order.orderStatus = "Return Processed";
    }

    // Update payment status
    order.paymentInfo.status = paymentStatus;

    await order.save();

    res.status(200).json({
        success: true,
        message: "Return status and payment status updated successfully",
        order,
    });
});
