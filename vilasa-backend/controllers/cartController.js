const Cart = require('../model/Cart');

// Controller for handling cart-related operations

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id; // Assuming user ID is available in req.user

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ product: productId, quantity }]
      });
    } else {
      // Check if item already exists in cart
      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
      if (itemIndex !== -1) {
        // If item exists, update quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // If item does not exist, add new item
        cart.items.push({ product: productId, quantity });
      }
    }

    // Calculate total price
    cart.totalPrice = cart.items.reduce((total, item) => {
      return total + (item.quantity * item.product.price);
    }, 0);

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update item quantity in cart
exports.updateCartItemQuantity = async (req, res) => {
  try {
    const { cartItemId, quantity } = req.body;
    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.id(cartItemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    item.quantity = quantity;
    cart.totalPrice = cart.items.reduce((total, item) => {
      return total + (item.quantity * item.product.price);
    }, 0);

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete item from cart
exports.deleteCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.body;
    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items.pull(cartItemId);
    cart.totalPrice = cart.items.reduce((total, item) => {
      return total + (item.quantity * item.product.price);
    }, 0);

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
// Get all items in the cart
exports.getAllItemsInCart = async (req, res) => {
    try {
      const userId = req.user._id;
      const cart = await Cart.findOne({ user: userId }).populate('items.product');
  
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }
  
      res.status(200).json(cart.items);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  