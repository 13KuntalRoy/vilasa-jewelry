// Import necessary models or services
const Order = require('../model/orderModel');
const Product = require('../model/productModel');
const User = require('../model/userModel');
const moment = require('moment');

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
exports.categoryWiseProductCount = async (req, res, next) => {
  try {
      const categoryCounts = await Product.aggregate([
          {
              $group: {
                  _id: '$category',
                  totalQuantity: { $sum: '$stock' }
              }
          },
          {
              $lookup: {
                  from: 'categories', // Collection name of categories
                  localField: '_id',
                  foreignField: '_id',
                  as: 'category'
              }
          },
          {
              $unwind: '$category'
          },
          {
              $project: {
                  _id: 0,
                  categoryName: '$category.title',
                  totalQuantity: 1
              }
          }
      ]);

      res.status(200).json(categoryCounts);
  } catch (error) {
      console.error('Error fetching category-wise product quantity count:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};
exports.getSalesDataByYearAndMonth = async (req, res) => {
  try {
    // Calculate the current date
    const currentDate = moment();
    const startYear = 2024;
    const currentYear = currentDate.year();
    const currentMonth = currentDate.month() + 1; // Moment.js months are zero-indexed

    // Initialize an array to hold the sales data
    const salesData = [];

    // Loop through each year from the start year to the current year
    for (let year = startYear; year <= currentYear; year++) {
      // Determine the end month for the current year
      const endMonth = year === currentYear ? currentMonth : 12;

      // Loop through each month of the current year
      for (let month = 1; month <= endMonth; month++) {
        // Query the database to get sales data for the specified year and month
        const monthlySalesData = await Order.aggregate([
          {
            $addFields: {
              createdAt: {
                $convert: {
                  input: "$createdAt",
                  to: "date",
                  onError: "$createdAt", // Keep the original value if conversion fails
                  onNull: "$createdAt"   // Keep the original value if the field is null
                }
              }
            }
          },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: [{ $year: '$createdAt' }, year] },
                  { $eq: [{ $month: '$createdAt' }, month] }
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

        // Format the sales data for the response
        const formattedMonthlySalesData = monthlySalesData.map(item => ({
          day: item._id,
          totalSales: item.totalSales
        }));

        // Add the sales data for the current month to the sales data array
        salesData.push({
          year,
          month,
          sales: formattedMonthlySalesData
        });
      }
    }

    res.status(200).json(salesData);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller function to fetch total sales data by category
// exports.getTotalSalesByCategory = async (req, res) => {
//     try {
//       // Query the database to retrieve all orders
//       const orders = await Order.find().populate('orderItems.productId');
  
//       // Process the retrieved data to calculate the total sales for each category
//       const categorySales = {};
//       for (const order of orders) {
//         for (const item of order.orderItems) {
//           const product = item.productId;
//           if (product && product.category) {
//             const category = product.category.toString();
//             const quantity = item.quantity;
//             if (!categorySales[category]) {
//               categorySales[category] = 0;
//             }
//             categorySales[category] += quantity;
//           }
//         }
//       }
  
//       // Prepare the data for the pie chart format
//       const pieChartData = [];
//       for (const category in categorySales) {
//         pieChartData.push({
//           category,
//           totalSales: categorySales[category],
//         });
//       }
  
//       // Send the pie chart data as the response
//       res.status(200).json(pieChartData);
//     } catch (error) {
//       console.error('Error fetching total sales data by category:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   };
exports.getTotalSalesByCategory = async (req, res) => {
  try {
    // Query the database to retrieve all orders
    const orders = await Order.find().populate({
      path: 'orderItems.productId',
      populate: {
        path: 'category',
        model: 'Category',
      },
    });

    // Process the retrieved data to calculate the total sales for each category
    const categorySales = {};
    for (const order of orders) {
      for (const item of order.orderItems) {
        const product = item.productId;
        if (product && product.category) {
          const category = product.category.title;
          const quantity = item.quantity;
          if (!categorySales[category]) {
            categorySales[category] = 0;
          }
          categorySales[category] += quantity;
        }
      }
    }

    // Prepare the data for the pie chart format
    const pieChartData = [];
    for (const category in categorySales) {
      pieChartData.push({
        category,
        totalSales: categorySales[category],
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
exports.getSalesAndReturnsByYearAndMonth = async (req, res) => {
  try {
    const currentDate = moment();
    const startYear = 2024;
    const currentYear = currentDate.year();
    const currentMonth = currentDate.month() + 1; // Moment.js months are zero-indexed

    const data = [];

    for (let year = startYear; year <= currentYear; year++) {
      const endMonth = year === currentYear ? currentMonth : 12;

      for (let month = 1; month <= endMonth; month++) {
        const monthlyData = await Order.aggregate([
          {
            $addFields: {
              createdAt: {
                $convert: {
                  input: "$createdAt",
                  to: "date",
                  onError: "$createdAt",
                  onNull: "$createdAt"
                }
              }
            }
          },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: [{ $year: '$createdAt' }, year] },
                  { $eq: [{ $month: '$createdAt' }, month] }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              totalSales: { $sum: 1 }, // Count the number of sales
              totalReturns: {
                $sum: {
                  $cond: [{ $eq: ['$returnInfo.returnStatus', 'Processed'] }, 1, 0]
                }
              } // Count the number of returns
            }
          }
        ]);

        const formattedData = {
          year,
          month,
          totalSales: monthlyData.length > 0 ? monthlyData[0].totalSales : 0,
          totalReturns: monthlyData.length > 0 ? monthlyData[0].totalReturns : 0
        };

        data.push(formattedData);
      }
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching sales and returns data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
