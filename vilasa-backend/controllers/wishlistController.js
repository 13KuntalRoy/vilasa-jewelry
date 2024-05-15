const Wishlist = require('../model/Wishlist');

// Controller for handling wishlist-related operations

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id; // Assuming user ID is available in req.user
    console.log(productId);
    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        products: [productId]
      });
    } else {
      // Check if product already exists in wishlist
      const productIndex = wishlist.products.findIndex(prod => prod.toString() === productId);
      if (productIndex === -1) {
        // If product does not exist, add to wishlist
        wishlist.products.push(productId);
      }
    }

    await wishlist.save();
    res.status(200).json(wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete product from wishlist
exports.deleteFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    wishlist.products.pull(productId);
    await wishlist.save();
    res.status(200).json(wishlist);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Get all items in the wishlist
exports.getAllItemsInWishlist = async (req, res) => {
    try {
      const userId = req.user._id;
      const wishlist = await Wishlist.findOne({ user: userId }).populate('products');
  
      if (!wishlist) {
        return res.status(404).json({ error: 'Wishlist not found' });
      }
  
      res.status(200).json(wishlist.products);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  