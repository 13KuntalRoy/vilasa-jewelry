const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
// Define routes for wishlist-related operations using router.route
router.route('/wishlist-items')
  .get(isAuthenticatedUser,wishlistController.getAllItemsInWishlist) // Get all items in the wishlist
  .post(isAuthenticatedUser,wishlistController.addToWishlist); // Add product to wishlist

router.route('/wishlist-items/:itemId')
  .delete(wishlistController.deleteFromWishlist); // Delete product from wishlist

module.exports = router;
