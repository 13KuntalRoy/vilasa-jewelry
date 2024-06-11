// Corrected model import path
const Wishlist = require('../model/Wishlist');

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const productId = req.body.productId;
    const userId = req.user._id;

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        products: [productId]
      });
      await wishlist.save();
      return res.status(200).json(wishlist);
    } else {
      const productIndex = wishlist.products.findIndex(prod => prod.toString() === productId);
      if (productIndex !== -1) {
        return res.status(200).json({ message: 'Product is already in your wishlist' });
      } else {
        wishlist.products.push(productId);
        await wishlist.save();
        return res.status(200).json(wishlist);
      }
    }
  } catch (error) {
    console.error('Error adding product to wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete product from wishlist
exports.deleteFromWishlist = async (req, res) => {
  try {
    const productId = req.params.itemId;
    const userId = req.user._id;

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const productIndex = wishlist.products.findIndex(prod => prod.toString() === productId);

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found in wishlist' });
    }

    wishlist.products.splice(productIndex, 1);
    await wishlist.save();
    res.status(200).json(wishlist);
  } catch (error) {
    console.error('Error deleting product from wishlist:', error);
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
    console.error('Error retrieving wishlist items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
