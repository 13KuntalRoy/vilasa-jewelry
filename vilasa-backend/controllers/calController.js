// Import necessary models or services
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Controller function to get total sales amount
exports.getTotalSalesAmount = async () => {
  try {
    const orders = await Order.find({}); // Assuming your Order model has a field for total price
    const totalSalesAmount = orders.reduce((acc, order) => acc + order.totalPrice, 0);
    return totalSalesAmount;
  } catch (error) {
    throw new Error('Failed to get total sales amount');
  }
};

// Controller function to get total number of orders
exports.getTotalOrders = async () => {
  try {
    const totalOrders = await Order.countDocuments({});
    return totalOrders;
  } catch (error) {
    throw new Error('Failed to get total orders');
  }
};

// Controller function to get total number of products
exports.getTotalProducts = async () => {
  try {
    const totalProducts = await Product.countDocuments({});
    return totalProducts;
  } catch (error) {
    throw new Error('Failed to get total products');
  }
};

// Controller function to get total number of users
exports.getTotalUsers = async () => {
  try {
    const totalUsers = await User.countDocuments({});
    return totalUsers;
  } catch (error) {
    throw new Error('Failed to get total users');
  }
};
