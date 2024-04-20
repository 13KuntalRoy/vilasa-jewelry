const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');

// Define routes for wishlist-related operations using router.route
router.route('/wishlist-items')
  .get(wishlistController.getAllItemsInWishlist) // Get all items in the wishlist
  .post(wishlistController.addToWishlist); // Add product to wishlist

router.route('/wishlist-items/:itemId')
  .delete(wishlistController.deleteFromWishlist); // Delete product from wishlist

module.exports = router;
