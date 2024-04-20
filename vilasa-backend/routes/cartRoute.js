const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Define routes for cart-related operations using router.route
router.route('/cart-items')
  .get(cartController.getAllItemsInCart) // Get all items in the cart
  .post(cartController.addToCart); // Add item to cart

router.route('/cart-items/:itemId')
  .put(cartController.updateCartItemQuantity) // Update item quantity in cart
  .delete(cartController.deleteCartItem); // Delete item from cart

module.exports = router;
