// Import necessary models or services
const Order = require('../model/orderModel');
const Product = require('../model/productModel');
const User = require('../model/userModel');
const moment = require('moment');

// Controller function to get total sales amount
exports.getTotalSalesAmount = async () => {
  try {
    console.log("olllllllllll");
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
exports.categoryWiseProductCount = async (req, res, next) => {
  try {
      const categoryCounts = await Product.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } },
          {
              $lookup: {
                  from: 'categories', // Collection name of categories
                  localField: '_id',
                  foreignField: '_id',
                  as: 'category'
              }
          },
          {
              $project: {
                  _id: 0,
                  category: { $arrayElemAt: ['$category', 0] },
                  count: 1
              }
          },
          {
              $project: {
                  categoryName: '$category.title',
                  count: 1
              }
          }
      ]);

      res.status(200).json(categoryCounts);
  } catch (error) {
      console.error('Error fetching category-wise product count:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};
exports.getSalesDataByYearAndMonth = async (req, res) => {
  try {
      const { year, month } = req.params;

      // Calculate the start date dynamically based on the current date
      const currentDate = moment();
      const startYear = 2024;
      const startMonth = 1; // January
      const currentYear = currentDate.year();
      const currentMonth = currentDate.month() + 1; // Moment.js months are zero-indexed

      // Check if the requested year and month are valid
      if (parseInt(year) < startYear || (parseInt(year) === startYear && parseInt(month) < startMonth)) {
          return res.status(400).json({ error: 'Invalid year or month' });
      }

      // Query the database to get sales data for the specified year and month
      const salesData = await Order.aggregate([
          {
              $match: {
                  $expr: {
                      $and: [
                          { $eq: [{ $year: '$createdAt' }, parseInt(year)] },
                          { $eq: [{ $month: '$createdAt' }, parseInt(month)] }
                      ]
                  }
              }
          },
          {
              $group: {
                  _id: { $dayOfMonth: '$createdAt' }, // Group by day of the month
                  totalSales: { $sum: '$totalPrice' } // Calculate total sales for each day
              }
          },
          {
              $sort: { _id: 1 } // Sort by day of the month
          }
      ]);

      // Prepare the response
      const formattedSalesData = salesData.map(item => ({
          day: item._id,
          totalSales: item.totalSales
      }));

      res.status(200).json(formattedSalesData);
  } catch (error) {
      console.error('Error fetching sales data:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};
// Controller function to fetch total sales data by category
exports.getTotalSalesByCategory = async (req, res) => {
  try {
      // Query the database to retrieve all orders
      const orders = await Order.find().populate('orderItems.productId');

      // Process the retrieved data to calculate the total sales for each category
      const categorySales = {};
      orders.forEach(order => {
          order.orderItems.forEach(item => {
              const category = item.productId.category; // Assuming each product has a 'category' field
              const quantity = item.quantity;
              if (!categorySales[category]) {
                  categorySales[category] = 0;
              }
              categorySales[category] += quantity;
          });
      });

      // Prepare the data for the pie chart format
      const pieChartData = [];
      for (const category in categorySales) {
          pieChartData.push({
              category: category,
              totalSales: categorySales[category]
          });
      }

      // Send the pie chart data as the response
      res.status(200).json(pieChartData);
  } catch (error) {
      console.error('Error fetching total sales data by category:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller function to calculate total revenue
exports.getTotalRevenue = async (req, res) => {
  try {
      // Query the database to retrieve all orders
      const orders = await Order.find();

      // Calculate total revenue
      let totalRevenue = 0;
      orders.forEach(order => {
          totalRevenue += order.totalPrice;
      });

      // Send the total revenue as the response
      res.status(200).json({ totalRevenue });
  } catch (error) {
      console.error('Error calculating total revenue:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller function to calculate total return
exports.getTotalReturn = async (req, res) => {
  try {
      // Query the database to retrieve all orders
      const orders = await Order.find();

      // Calculate total return
      let totalReturn = 0;
      orders.forEach(order => {
          if (order.returnInfo && order.returnInfo.returnStatus === 'Processed') {
              totalReturn += order.totalPrice;
          }
      });

      // Send the total return as the response
      res.status(200).json({ totalReturn });
  } catch (error) {
      console.error('Error calculating total return:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};
