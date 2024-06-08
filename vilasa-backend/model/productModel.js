const mongoose = require('mongoose');

/**
 * Artificial Jewelry Product Schema
 * Represents artificial jewelry products in the e-commerce system.
 * Author: Kuntal Roy
 * Vilasa confidential
 */
const productSchema = new mongoose.Schema({
  // ID for the product (auto-generated)
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },

  // Jewelry name
  name: {
    type: String,
    required: [true, "Please enter product name"],
    trim: true,
    // Explanation: Name of the jewelry product. Required field, trimmed.
  },

  // Jewelry description
  description: {
    type: String,
    required: [true, "Please enter product description"],
    // Explanation: Description of the jewelry product. Required field.
  },

  // Highlights of the jewelry
  highlights: {
    type: [String],
    required: true,
    // Explanation: Highlights of the jewelry product. Must be an array.
  },

  // Specifications of the jewelry
  specifications: [
    {
      title: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      }
    }
  ],

  // Jewelry price
  price: {
    type: Number,
    required: [true, "Please enter product price"],
    // Explanation: Price of the jewelry product. Required field.
  },

  // Cutted price of the jewelry
  cuttedPrice: {
    type: Number,
    required: [true, "Please enter cutted price"],
    // Explanation: Cutted price of the jewelry product. Required field.
  },

  // Images of the jewelry
  images: [
    {
      public_id: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    }
  ],

  // Brand information
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  },

  // Jewelry category
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },

  // Discount for the product
  discount: {
    type: Number,
    default: 0,
    // Explanation: Discount percentage for the product. Default value is 0.
  },

  // Product stock
  stock: {
    type: Number,
    required: [true, "Please enter product stock"],
    maxlength: [4, "Stock cannot exceed limit"],
    default: 1,
    // Explanation: Available stock quantity of the product. Default value is 1.
  },
  Sold: {
    type: Number,
    default: 0,
    // Explanation: Number of pieces sold for this product. Default value is 0.
  },

  // Product warranty
  warranty: {
    type: Number,
    default: 0,
    // Explanation: Warranty period for the product. Default value is 0 year.
  },
  productweight:{
    type: Number,
    default: 0,
    // Explanation: Weight of the product. Default value is 0.
  },

  // Product ratings
  ratings: {
    type: Number,
    default: 0,
    // Explanation: Overall rating of the product. Default value is 0.
  },

  // Number of reviews for the product
  numOfReviews: {
    type: Number,
    default: 0,
    // Explanation: Number of reviews received for the product. Default value is 0.
  },

  // Reviews for the product
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      name: {
        type: String,
        required: true
      },
      rating: {
        type: Number,
        required: true
      },
      comment: {
        type: String,
        required: true
      },
      images: [ // Array of images showing the product received by the user
        {
          public_id: {
            type: String,
            required: true
          },
          url: {
            type: String,
            required: true
          }
        }
      ],
      showOnLandingPage: {
        type: Boolean,
        default: false,
        // Explanation: Indicates whether to show this review on the product landing page. Default value is true.
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  // Admin user who added the product
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Date when the product was created
  createdAt: {
    type: Date,
    default: Date.now
    // Explanation: Date when the product was created. Default value is the current date.
  },
  offerStartTime: {
    type: Date, // Combine date and time
  },
  offerEndTime: {
    type: Date, // Combine date and time
  },
  coupons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  }]

});

module.exports = mongoose.model('Product', productSchema);
