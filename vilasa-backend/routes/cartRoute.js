const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const { route } = require('./orderRoute');
// Define routes for cart-related operations using router.route
router.route('/cart-items')
  .get(isAuthenticatedUser,cartController.getAllItemsInCart) // Get all items in the cart
  .post(isAuthenticatedUser,cartController.addToCart); // Add item to cart

router.route('/cart-items/:itemId')
  .put(isAuthenticatedUser,cartController.updateCartItemQuantity) // Update item quantity in cart
  .delete(isAuthenticatedUser,cartController.deleteCartItem); // Delete item from cart
// router.route('/cart/aftercouponapply').post(isAuthenticatedUser,cartController.updateCartQuantity)
router.route('deleteCartItem/cart-items/:itemId')
  .delete(isAuthenticatedUser, cartController.removeItemFromCart);


module.exports = router;
