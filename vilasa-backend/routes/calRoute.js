const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/calController');

// Route to get total sales amount
router.get('/total-sales-amount', async (req, res) => {
  try {
    const totalSalesAmount = await dashboardController.getTotalSalesAmount();
    res.json({ totalSalesAmount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get total number of orders
router.get('/total-orders', async (req, res) => {
  try {
    const totalOrders = await dashboardController.getTotalOrders();
    res.json({ totalOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get total number of products
router.get('/total-products', async (req, res) => {
  try {
    const totalProducts = await dashboardController.getTotalProducts();
    res.json({ totalProducts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get total number of users
router.get('/total-users', async (req, res) => {
  try {
    const totalUsers = await dashboardController.getTotalUsers();
    res.json({ totalUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get category-wise product count
router.get('/category-wise-product-count', dashboardController.categoryWiseProductCount);

// Route to get sales data by year and month
router.route('/sales/data').get(dashboardController.getSalesDataByYearAndMonth);
// Route to get total sales by category
router.get('/total-sales-by-category', dashboardController.getTotalSalesByCategory);

// Route to get total revenue
router.get('/total-revenue', dashboardController.getTotalRevenue);

// Route to get total return
router.get('/total-return', dashboardController.getTotalReturn);

// Route to get year and month-wise sales and return data
router.route('/sales-returns').get(dashboardController.getSalesAndReturnsByYearAndMonth);
module.exports = router;