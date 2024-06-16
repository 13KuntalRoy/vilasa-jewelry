const asyncErrorHandler = require('../middleware/asyncErrorHandler');
const Order = require('../model/orderModel');
const Coupon = require('../model/Coupon');
const Product = require('../model/productModel');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/sendEmail');
const mongoose = require('mongoose');
const Payment = require("../model/paymentModel");
const Razorpay = require("razorpay");
const { v4: uuidv4 } = require("uuid");
// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
exports.updateCartQuantity = async (req, res, next) => {
    try {
        const { productId, quantity, couponName } = req.body;

        // Validate product ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new ErrorHandler('Invalid product ID', 400);
        }

        // Find the product by ID
        const product = await Product.findById(productId);
        if (!product) {
            throw new ErrorHandler('Product not found', 404);
        }

        // Calculate the updated total price
        let totalPrice = product.price * quantity;
        let discountPrice = product.price;

        // If a coupon is applied, calculate the discount price
        if (couponName) {
            const coupon = await Coupon.findOne({ name: couponName });
            if (coupon && product.price >= coupon.validateamount && new Date(coupon.expiry) > new Date()) {
                discountPrice -= (product.price * coupon.discount) / 100;
            }
            totalPrice = discountPrice * quantity;
        }

        res.status(200).json({
            success: true,
            productId: product._id,
            quantity,
            discountPrice,
            totalPrice
        });
    } catch (error) {
        next(error);
    }
};
exports.applyCoupons = async (req, res, next) => {
    try {
        const { selectedProducts, couponName } = req.body;

        if (!selectedProducts || selectedProducts.length === 0) {
            throw new ErrorHandler('Selected products are required', 400);
        }

        if (!couponName) {
            throw new ErrorHandler('Coupon name is required', 400);
        }

        // Find the coupon by name
        const coupon = await Coupon.findOne({ name: couponName });
        if (!coupon) {
            throw new ErrorHandler('Invalid coupon name provided', 404);
        }

        // Check coupon expiry date
        if (new Date(coupon.expiry) < new Date()) {
            throw new ErrorHandler('Coupon has expired', 400);
        }

        let totalOriginalPrice = 0;
        let totalDiscountPrice = 0;
        let isValidCoupon = false;

        const productsWithCoupons = await Promise.all(selectedProducts.map(async (selectedProduct) => {
            // Validate product ID
            if (!mongoose.Types.ObjectId.isValid(selectedProduct.productId)) {
                throw new ErrorHandler(`Invalid product ID: ${selectedProduct.productId}`, 400);
            }

            const product = await Product.findById(selectedProduct.productId);
            if (!product) {
                throw new ErrorHandler(`Product not found: ${selectedProduct.productId}`, 404);
            }

            // Calculate total price and discount price for the product considering its quantity
            const totalPriceForItem = product.price * selectedProduct.quantity;
            let discountPriceForItem = totalPriceForItem;

            if (product.price >= coupon.validateamount) {
                const discountPercentage = coupon.discount / 100;
                const discountAmount = product.price * discountPercentage;
                discountPriceForItem -= discountAmount * selectedProduct.quantity;
                isValidCoupon = true;
            }

            totalOriginalPrice += totalPriceForItem;
            totalDiscountPrice += discountPriceForItem;

            return {
                name: product.name,
                price: totalPriceForItem,
                quantity: selectedProduct.quantity,
                discountPrice: discountPriceForItem,
                productId: product._id,
                image: product.images // Assuming 'images' is a field in your Product model
            };
        }));

        if (!isValidCoupon) {
            throw new ErrorHandler('Coupon is not applicable to any selected products', 400);
        }

        res.status(200).json({
            success: true,
            orderItems: productsWithCoupons,
            totalOriginalPrice,
            totalDiscountPrice
        });

    } catch (error) {
        next(error);
    }
};

  
  /**
   * @desc    Create a new order with Razorpay or Cash on Delivery (COD)
   * @route   POST /api/orders/new
   * @access  Private
   */
exports.newOrder = asyncErrorHandler(async (req, res, next) => {
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      totalPrice,
      discountedPrice,
      itemsPrice,
      taxPrice,
      shippingPrice,
    } = req.body;
  
    // Validate input data
    if (!shippingInfo || !orderItems || !paymentInfo || !totalPrice) {
      return next(new ErrorHandler("Invalid input data", 422));
    }
  
    // Check payment status (for other methods, not needed for Razorpay)
    if (!paymentInfo.status && paymentInfo.method !== "cod") {
      return next(new ErrorHandler("Payment failed", 400));
    }
  
    // Check if order with the same paymentInfo already exists (for other methods)
    if (paymentInfo.method !== "razorpay") {
      const orderExist = await Order.exists({ paymentInfo });
      if (orderExist) {
        return next(new ErrorHandler("Order Already Placed", 400));
      }
    }
  
    // Validate existence of each product
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }
    }
  
    let order;
    let payment;
  
    if (paymentInfo.method === "razorpay") {
      // Create Razorpay order
      const razorpayOrder = await createRazorpayOrder(totalPrice);
  
      // Create the payment record
      payment = await Payment.create({
        orderId: razorpayOrder.id,
        amount: totalPrice,
        status: "pending", // Initial status can be pending or similar
        method: "razorpay",
        user: req.user._id,
      });
  
      order = await createOrderAndHandleStock(
        shippingInfo,
        orderItems,
        paymentInfo,
        totalPrice,
        discountedPrice,
        itemsPrice,
        taxPrice,
        shippingPrice,
        payment._id,
        req.user._id
      );
    } else if (paymentInfo.method === "cod") {
      // For Cash on Delivery (COD)
      payment = await Payment.create({
        orderId: uuidv4(), // Generate a unique ID for COD orders
        amount: totalPrice,
        status: "pending", // Initial status can be pending or similar
        method: "cod",
        user: req.user._id,
      });
  
      order = await createOrderAndHandleStock(
        shippingInfo,
        orderItems,
        paymentInfo,
        totalPrice,
        discountedPrice,
        itemsPrice,
        taxPrice,
        shippingPrice,
        payment._id,
        req.user._id
      );
    } else {
      return next(new ErrorHandler("Invalid payment method", 400));
    }
  
    // Send email notification about the new order in parallel
    try {
      await sendOrderConfirmationEmail(req.user.email, order._id, req.user.name);
    } catch (error) {
      return next(new ErrorHandler("Failed to send email notification", 500));
    }
  
    res.status(201).json({
      success: true,
      order,
    });
  });
  
  // Function to create a Razorpay order
  const createRazorpayOrder = async (amount) => {
    const options = {
      amount: amount * 100, // Amount in smallest currency unit (paise for INR)
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };
  
    try {
      const razorpayOrder = await razorpay.orders.create(options);
      return razorpayOrder;
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      throw new Error("Failed to create Razorpay order");
    }
  };
  
  // Function to create order and update product stock
  const createOrderAndHandleStock = async (
    shippingInfo,
    orderItems,
    paymentInfo,
    totalPrice,
    discountedPrice,
    itemsPrice,
    taxPrice,
    shippingPrice,
    paymentId,
    userId
  ) => {
    try {
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
        paid: false, // Set paid to false initially
        user: userId,
      });
  
      // Update product stock asynchronously for each order item
      await Promise.all(
        order.orderItems.map(async (item) => {
          await updateStock(item.productId, item.quantity);
          await updatePiecesSold(item.productId, item.quantity); // Update piecesSold count
        })
      );
  
      // Link the payment ID to the order
      order.paymentInfo.id = paymentId;
      order.paid = true;
      order.paidAt = Date.now();
      await order.save();
  
      return order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw new Error("Failed to create order");
    }
  };
  
  // Function to update product stock
//   const updateStock = async (productId, quantity) => {
//     await Product.findByIdAndUpdate(productId, { $inc: { stock: -quantity } });
//   };
  
  // Function to update piecesSold count for a product
  const updatePiecesSold = async (productId, quantity) => {
    await Product.findByIdAndUpdate(productId, {
      $inc: { piecesSold: quantity },
    });
  };
  
  // Function to send order confirmation email
  const sendOrderConfirmationEmail = async (email, orderId, userName) => {
    await sendEmail({
      email: email,
      subject: "New Order Confirmation",
      message: `Dear ${userName}, your order with ID ${orderId} has been successfully placed.`,
    });
  };

// /**
//  * @desc    Create a new order
//  * @route   POST /api/orders/new
//  * @access  Private
//  */
// exports.newOrder = asyncErrorHandler(async (req, res, next) => {
//     const { shippingInfo, orderItems, paymentInfo, totalPrice, discountedPrice, itemsPrice, taxPrice, shippingPrice } = req.body;

//     // Validate input data
//     if (!shippingInfo || !orderItems || !paymentInfo || !totalPrice) {
//         return next(new ErrorHandler("Invalid input data", 422)); // 422 for Unprocessable Entity
//     }

//     // Check payment status
//     if (!paymentInfo.status) {
//         return next(new ErrorHandler("Payment failed", 400));
//     }

//     // Check if order with the same paymentInfo already exists
//     const orderExist = await Order.exists({ paymentInfo });

//     if (orderExist) {
//         return next(new ErrorHandler("Order Already Placed", 400));
//     }

//     // Validate existence of each product
//     for (const item of orderItems) {
//         const product = await Product.findById(item.productId);
//         if (!product) {
//             return next(new ErrorHandler("Product not found", 404));
//         }
//     }

//     // Create the order
//     const order = await Order.create({
//         shippingInfo,
//         orderItems,
//         paymentInfo,
//         totalPrice,
//         discountedPrice,
//         itemsPrice,
//         taxPrice,
//         shippingPrice,
//         paid: true,
//         paidAt: Date.now(),
//         user: req.user._id,
//     });

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

// // Function to update product stock
// async function updateStock(productId, quantity) {
//     await Product.findByIdAndUpdate(productId, { $inc: { stock: -quantity } });
// }

// // Function to update piecesSold count for a product
// async function updatePiecesSold(productId, quantity) {
//     await Product.findByIdAndUpdate(productId, { $inc: { piecesSold: quantity } });
// }

// // Function to send order confirmation email
// async function sendOrderConfirmationEmail(email, orderId, userName) {
//     await sendEmail({
//         email: email,
//         subject: 'New Order Confirmation',
//         message: `Dear ${userName}, your order with ID ${orderId} has been successfully placed.`,
//     });
// }
// /**
//  * @desc    Initiate a return for an order
//  * @route   POST /api/orders/:id/return
//  * @access  Private
//  */
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
