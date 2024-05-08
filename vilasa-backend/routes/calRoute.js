const express = require('express');
const router = express.Router();
const {
  getTotalSalesAmount,
  getTotalOrders,
  getTotalProducts,
  getTotalUsers
} = require('../controllers/calController'); // Update this with the path to your controller file

// Define routes using router.route()
router.route('/total-sales-amount')
  .get(async (req, res) => {
    try {
      const totalSalesAmount = await getTotalSalesAmount();
      res.json({ totalSalesAmount });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

router.route('/total-orders')
  .get(async (req, res) => {
    try {
      const totalOrders = await getTotalOrders();
      res.json({ totalOrders });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

router.route('/total-products')
  .get(async (req, res) => {
    try {
      const totalProducts = await getTotalProducts();
      res.json({ totalProducts });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

router.route('/total-users')
  .get(async (req, res) => {
    try {
      const totalUsers = await getTotalUsers();
      res.json({ totalUsers });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

module.exports = router;
