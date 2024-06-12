const Cart = require('../model/Cart');
const Product = require('../model/productModel');

// Controller for handling cart-related operations

// exports.addToCart = async (req, res) => {
//   try {
//     const { productId, quantity } = req.body;
//     const userId = req.user._id; // Assuming user ID is available in req.user

//     // Find the cart for the user
//     let cart = await Cart.findOne({ user: userId });

//     // If the cart doesn't exist, create a new one
//     if (!cart) {
//       cart = new Cart({
//         user: userId,
//         items: [{ product: productId, quantity }]
//       });
//     } else {
//       // Check if the product already exists in the cart
//       const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);

//       if (existingItemIndex !== -1) {
//         // If the product exists, update its quantity
//         cart.items[existingItemIndex].quantity += quantity;
//       } else {
//         // If the product doesn't exist, add it to the cart
//         cart.items.push({ product: productId, quantity });
//       }
//     }

//     // Calculate the total price of the items in the cart
//     let totalPrice = 0;
//     for (const item of cart.items) {
//       const product = await Product.findById(item.product);
//       if (product) {
//         totalPrice += product.price * item.quantity;
//       }
//     }

//     // Update the total price in the cart
//     cart.totalPrice = totalPrice;

//     // Save the cart
//     await cart.save();

//     // Respond with the updated cart
//     res.status(200).json(cart);
//   } catch (error) {
//     console.error('Error adding to cart:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id; // Assuming user ID is available in req.user

    // Find the cart for the user
    let cart = await Cart.findOne({ user: userId });

    // Fetch the product
    const product = await Product.findById(productId);

    // If the product doesn't exist, return an error
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    console.log(product.stock);
    console.log(quantity);
    // Check if the requested quantity exceeds the available stock for the product
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
    }


    // If the cart doesn't exist, create a new one
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ product: productId, quantity }]
      });
    } else {
      // Check if the product already exists in the cart
      const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);

      if (existingItemIndex !== -1) {
        // If the product exists, update its quantity
        const newQuantity = Number(cart.items[existingItemIndex].quantity) + Number(quantity);

        // Check if the new quantity exceeds the available stock for the product
        console.log(newQuantity);
        if (product.stock < newQuantity) {
          return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
        }
        cart.items[existingItemIndex].quantity = newQuantity;
      } else {
        // If the product doesn't exist, add it to the cart
        cart.items.push({ product: productId, quantity });
      }
    }

    // Calculate the total price of the items in the cart
    let totalPrice = 0;
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (product) {
        totalPrice += product.price * item.quantity;
      }
    }

    // Update the total price in the cart
    cart.totalPrice = totalPrice;

    // Save the cart
    await cart.save();

    // Respond with the updated cart
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update item quantity in cart
exports.updateCartItemQuantity = async (req, res) => {
  try {
    let { cartItemId, quantity } = req.body;
    const userId = req.user._id;

    // If quantity is not provided, set it to 1
    if (!quantity) {
      quantity = 1;
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.id(cartItemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    // Fetch the product associated with the cart item
    const product = await Product.findById(item.product);

    // If the product doesn't exist, return an error
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if the requested quantity exceeds the available stock for the product
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
    }

    // Update the quantity of the cart item
    item.quantity = quantity;

    // Calculate the total price of the items in the cart
    let totalPrice = 0;
    for (const cartItem of cart.items) {
      const cartProduct = await Product.findById(cartItem.product);
      if (cartProduct) {
        totalPrice += cartProduct.price * cartItem.quantity;
      }
    }

    // Update the total price in the cart
    cart.totalPrice = totalPrice;

    // Save the updated cart
    await cart.save();

    // Respond with the updated cart
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Delete item from cart
exports.deleteCartItem = async (req, res) => {
  try {
    const cartItemId = req.params.itemId;
    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Find the index of the cart item to be removed
    const itemIndex = cart.items.findIndex(item => item._id.toString() === cartItemId);

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    // Fetch the product associated with the cart item
    const product = await Product.findById(cart.items[itemIndex].product);

    // If the product doesn't exist, return an error
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Calculate the price of the item to be removed
    const removedItemPrice = product.price;

    // Decrement the quantity of the item in the cart
    cart.items[itemIndex].quantity -= 1;

    // If the quantity becomes 0, remove the item completely from the cart
    if (cart.items[itemIndex].quantity === 0) {
      cart.items.splice(itemIndex, 1);
    }

    // Update the total price by subtracting the price of the removed item
    cart.totalPrice -= removedItemPrice;

    // Save the updated cart
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.error('Error deleting cart item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Get all items in the cart
// Get all items in the cart
// Get all items in the cart
exports.getAllItemsInCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product'
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Extract item details including product details and item _id
    const itemsWithDetails = cart.items.map(item => ({
      _id: item._id, // Include the item _id
      product: item.product, // Include all product details
      quantity: item.quantity
    }));

    res.status(200).json({ cart: { items: itemsWithDetails, totalPrice: cart.totalPrice } });
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete item from cart
// Remove item from cart (remove item entirely regardless of quantity)
exports.removeItemFromCart = async (req, res) => {
  try {
    const cartItemId = req.params.itemId;
    const userId = req.user._id;

    // Find the user's cart
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Find the index of the cart item to be removed
    const itemIndex = cart.items.findIndex(item => item._id.toString() === cartItemId);

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    // Remove the item from the cart
    cart.items.splice(itemIndex, 1);

    // Recalculate the total price of the cart
    cart.totalPrice = cart.items.reduce((total, item) => {
      const productPrice = item.product.price;
      const itemTotalPrice = productPrice * item.quantity;
      return total + itemTotalPrice;
    }, 0);

    // Save the updated cart
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.error('Error deleting cart item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};