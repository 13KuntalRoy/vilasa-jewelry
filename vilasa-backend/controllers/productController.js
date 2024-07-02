const ProductModel = require('../model/productModel');
const Brand = require('../model//Brand');
const Category = require('../model/Category');
const Coupon = require('../model/Coupon');
const ErrorHandler = require("../utils/errorHandler");
const asyncErrorHandler = require("../middleware/asyncErrorHandler");
const SearchFeatures = require("../utils/searchFeatures");
const cloudinary = require("cloudinary");
const productModel = require('../model/productModel');
const Material = require('../model/Material');


/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private (Admin)
 */
exports.createProduct = asyncErrorHandler(async (req, res) => {
  try {
    // Extract admin user ID from request
    const adminUserId = req.user.id;
    console.log(req);
    // Extract product data based on content type
    let productData;
    let images = [];
    if (req.is('json')) {
      // JSON request
      productData = req.body;
      images = req.files ? req.files.images || [] : [];
    } else if (req.is('multipart/form-data')) {
      // Form-data request
      productData = {
        discount: req.body.discount,
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        cuttedPrice: req.body.cuttedPrice,
        category: req.body.category,
        stock: req.body.stock,
        warranty: req.body.warranty,
        ratings: req.body.ratings,
        numOfReviews: req.body.numOfReviews,
        offerStartTime: req.body.offerStartTime,
        offerEndTime: req.body.offerEndTime,
        brand: req.body.brand,
        material:req.body.material,
        productweight: req.body.productweight,
        SKU:req.body.SKU,
        highlights: [],
        specifications: [],
        // coupons:[]

      };
      // Process highlights
      for (let i = 0; req.body[`highlights[${i}]`]; i++) {
        productData.highlights.push(req.body[`highlights[${i}]`]);
      }

      // Process specifications
      for (let i = 0; req.body[`specifications[${i}][title]`]; i++) {
        productData.specifications.push({
          title: req.body[`specifications[${i}][title]`],
          description: req.body[`specifications[${i}][description]`]
        });
      }
      
      // for (let i = 0; req.body[`coupons[${i}]`]; i++) {
      //   productData.coupons.push(
      //   req.body[`coupons[${i}]`],
          
      //   );
      // }
      // Process images
      images = req.files ? req.files.images || [] : [];
    }

    // Upload images to Cloudinary and get image links
    const uploadedImages = await Promise.all(images.map(async (image) => {
      const result = await cloudinary.uploader.upload(image.tempFilePath, { folder: 'Products' });
      return { public_id: result.public_id, url: result.secure_url };
    }));

    // Add admin user ID and uploaded image links to product data
    productData.user = adminUserId;
    productData.images = uploadedImages;

    // Create the new product
    const product = await ProductModel.create(productData);

    // Send success response
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    // Send error response
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Get all products with pagination
 * @param {Request} req The request object
 * @param {Response} res The response object
 */
// exports.getAllProducts = async (req, res) => {
//   // Parse and validate the resultPerPage parameter
//   const resultPerPage = parseInt(req.query.resultPerPage) || 50;
//   if (resultPerPage < 1) {
//     return res.status(400).json({ success: false, message: "Invalid resultPerPage value" });
//   }

//   // Parse and validate the page parameter
//   const page = parseInt(req.query.page) || 1;
//   if (page < 1) {
//     return res.status(400).json({ success: false, message: "Invalid page value" });
//   }

//   try {
//     // Count total number of products
//     const productsCount = await ProductModel.countDocuments();

//     // Calculate skip value based on page number and resultPerPage
//     const skip = (page - 1) * resultPerPage;

//     // Fetch products with pagination and populate category and brand details
//     const products = await ProductModel.find()
//       .skip(skip)
//       .limit(resultPerPage)
//       .populate('category')
//       .populate('brand');

//     // Calculate total pages
//     const totalPages = Math.ceil(productsCount / resultPerPage);

//     res.status(200).json({
//       success: true,
//       products: products,
//       productsCount: productsCount,
//       resultPerPage: resultPerPage,
//       currentPage: page,
//       totalPages: totalPages,
//       filteredProductCount: products.length,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// }

exports.getAllProducts = async (req, res) => {
  try {
    // Parse and validate the resultPerPage parameter
    const resultPerPage = parseInt(req.query.resultPerPage) || 50;
    if (resultPerPage < 1) {
      return res.status(400).json({ success: false, message: "Invalid resultPerPage value" });
    }

    // Parse and validate the page parameter
    let page = parseInt(req.query.page) || 1;
    if (page < 1) {
      page = 1;
    }

    // Construct the filter object
    const filters = {};
    if (req.query.category) {
      const categories = Array.isArray(req.query.category) ? req.query.category : [req.query.category];
      filters.category = { $in: categories };
    }
    if (req.query.brand) {
      filters.brand = req.query.brand;
    }
    if (req.query.material) {
      const materials = Array.isArray(req.query.material) ? req.query.material : [req.query.material];
      filters.material = { $in: materials };
    }
    // Add more filters as needed, e.g., price range, search term, etc.

    // Count total number of filtered products
    const productsCount = await ProductModel.countDocuments(filters);

    // Calculate total pages
    const totalPages = Math.ceil(productsCount / resultPerPage);

    // Adjust page if it exceeds the total number of pages
    if (page > totalPages) {
      page = totalPages;
    }

    // Calculate skip value based on page number and resultPerPage
    const skip = (page - 1) * resultPerPage;

    // Fetch filtered products with pagination and populate category and brand details
    const products = await ProductModel.find(filters)
      .skip(skip)
      .limit(resultPerPage)
      .populate('category')
      .populate('brand');

    // Send the response with products data and pagination info
    res.status(200).json({
      success: true,
      products: products,
      productsCount: productsCount,
      resultPerPage: resultPerPage,
      currentPage: page,
      totalPages: totalPages,
      filteredProductCount: products.length,
    });
  } catch (error) {
    // Handle internal server error
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * @route   GET /api/products/admin
 * @desc    Get all products (Admin)
 * @access  Private (Admin)
 */
exports.getAllProductsAdmin = asyncErrorHandler(async (req, res) => {
  // Fetch all products and populate category and brand details
  const products = await ProductModel.find()
    .populate('category')
    .populate('brand');

  res.status(200).json({
    success: true,
    products,
  });
});
// Add Image to Product
exports.addProductImage = async (req, res) => {
  try {
      const { id } = req.params;
      const images =  req.files ? req.files.images || [] : [];

      if (! images) {
          return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      // Upload each file to Cloudinary and get the URLs
      const uploadPromises = images.map(async(image) => 
          cloudinary.uploader.upload(image.tempFilePath, { folder: 'products' })
      );

      const uploadResults = await Promise.all(uploadPromises);

      const image = uploadResults.map(result => ({
          public_id: result.public_id,
          url: result.secure_url
      }));

      const product = await productModel.findById(id);

      if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found' });
      }

      product.images.push(...image);
      await product.save();

      res.status(200).json({
          success: true,
          data: product
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Server Error',
          error: error.message
      });
  }
};

exports.updateProduct = asyncErrorHandler(async (req, res, next) => {
  let product = await ProductModel.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  // Prepare update data
  const updateData = req.body;

  // If there are fields to unset (remove), handle them separately
  if (updateData.$unset) {
    await ProductModel.updateOne({ _id: req.params.id }, { $unset: updateData.$unset });
    delete updateData.$unset; // Remove $unset from updateData to avoid conflicts
  }

  // Handle specifications update and addition
  if (updateData.specifications) {
    updateData.specifications.forEach(newSpec => {
      const existingSpecIndex = product.specifications.findIndex(spec => spec.title === newSpec.title);
      if (existingSpecIndex >= 0) {
        product.specifications[existingSpecIndex] = newSpec; // Update existing spec
      } else {
        product.specifications.push(newSpec); // Add new spec
      }
    });
  }

  // Handle specifications removal by title or ID
  if (updateData.removeSpecifications) {
    updateData.removeSpecifications.forEach(specToRemove => {
      product.specifications = product.specifications.filter(spec => 
        spec.title !== specToRemove.title && spec._id.toString() !== specToRemove._id
      );
    });
  }

  // Handle highlights removal
  if (updateData.removeHighlights) {
    product.highlights = product.highlights.filter(highlight => !updateData.removeHighlights.includes(highlight));
  }

  for (const key in updateData) {
    if (key !== 'specifications' && key !== 'removeSpecifications' && key !== 'removeHighlights' ) {
      product[key] = updateData[key];
    }
  }

  await product.save();

  res.status(200).json({
    success: true,
    data: product
  });
});


// Add Specification
exports.addProductSpecification = async (req, res) => {
  try {
      const { id } = req.params;
      const { title, description } = req.body;

      const product = await productModel.findById(id);

      if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found' });
      }

      product.specifications.push({ title, description });
      await product.save();

      res.status(200).json({
          success: true,
          data: product
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Server Error',
          error: error.message
      });
  }
};

// Delete Specification
exports.deleteProductSpecification = async (req, res) => {
  try {
      const { id, specId } = req.params;

      const product = await Product.findById(id);

      if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found' });
      }

      product.specifications = product.specifications.filter(spec => spec._id.toString() !== specId);

      await product.save();

      res.status(200).json({
          success: true,
          data: product
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Server Error',
          error: error.message
      });
  }
};

// Add Highlight
exports.addProductHighlight = async (req, res) => {
  try {
      const { id } = req.params;
      const { highlight } = req.body;

      const product = await productModel.findById(id);

      if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found' });
      }

      product.highlights.push(highlight);
      await product.save();

      res.status(200).json({
          success: true,
          data: product
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Server Error',
          error: error.message
      });
  }
};

// Delete Highlight
exports.deleteProductHighlight = async (req, res) => {
  try {
      const { id, highlight } = req.params;

      const product = await productModel.findById(id);

      if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found' });
      }

      product.highlights = product.highlights.filter(h => h !== highlight);

      await product.save();

      res.status(200).json({
          success: true,
          data: product
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Server Error',
          error: error.message
      });
  }
};

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Private (Admin)
 */
exports.deleteProduct = asyncErrorHandler(async (req, res, next) => {
  const productId = req.params.id;
  // Find the product by ID
  const product = await ProductModel.findById(productId);

  // Check if the product exists
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  // Extract product images
  const productImages = product.images || [];

  try {
    // Delete images from Cloudinary
    await Promise.all(productImages.map(async (image) => {
      console.log('Image:', image); 
      await cloudinary.v2.uploader.destroy(image.public_id);  
     
    }));

    // Remove the product from the database
    await ProductModel.findByIdAndRemove(productId);

    // Send success response
    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    // Handle any errors that occur during deletion
    return next(new ErrorHandler("Failed to delete product", 500));
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get product details
 * @access  Public
 */
exports.getProductDetails = asyncErrorHandler(async (req, res, next) => {
  try {
    const productId = req.params.id;

    // Find the product by ID and populate category and brand details
    const product = await ProductModel.findById(productId)
      .populate('category')
      .populate('brand');
      // .populate('coupons');

    // Check if the product exists
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    // Send success response with product details including category and brand
    res.status(200).json({
      success: true,
      product: product,
    });
  } catch (error) {
    // Handle any unexpected errors
    return next(new ErrorHandler("Failed to fetch product details", 500));
  }
});

exports.createProductReview = asyncErrorHandler(async (req, res, next) => {
  try {
    const { ratings, comment} = req.body;
    const productId = req.params.id;

    // Validate ratings value
    if (isNaN(ratings)) {
      return next(new ErrorHandler("Invalid ratings value", 400));
    }

    // Validate presence of required fields
    if (!ratings || !comment) {
      return next(new ErrorHandler("Please provide all required fields", 400));
    }

    // Upload image to Cloudinary
    
    const result = await cloudinary.uploader.upload(req.files.images.tempFilePath);
    const imageUrl = { public_id: result.public_id, url: result.secure_url };

    // Create review object
    const review = {
      user: req.user._id, // Populate user field with user ID
      name: req.user.name,
      rating: Number(ratings), // Corrected field name
      email: req.user.email,
      comment: comment,
      images: imageUrl, // Use a single image object instead of an array
    };

    // Find the product by ID
    const product = await ProductModel.findById(productId);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    // Add the new review to the product's reviews array
    product.reviews.push(review);

    // Update number of reviews
    product.numOfReviews = product.reviews.length;

    // Calculate average ratings
    let totalRatings = 0;
    product.reviews.forEach((rev) => {
      totalRatings += rev.rating; // Use 'rating' field
    });
    product.ratings = totalRatings / product.reviews.length;

    // Save product changes to the database
    await product.save();

    // Send success response
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Failed to create or update product review", 500));
  }
});


/**
 * @route   GET /api/products/:id/reviews
 * @desc    Get all reviews of a product
 * @access  Public
 */
exports.getProductReviews = asyncErrorHandler(async (req, res, next) => {
  try {
    // Find the product by ID
    const productId = req.params.id;
    const product = await ProductModel.findById(productId).populate({
      path: 'reviews.user',
    });

    // Check if the product exists
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    // Return the reviews of the product
    res.status(200).json({
      success: true,
      reviews: product.reviews,
    });
  } catch (error) {
    // Handle any errors that occur
    return next(new ErrorHandler("Failed to fetch product reviews", 500));
  }
});


/**
 * @route   DELETE /api/products/:id/reviews
 * @desc    Delete a review
 * @access  Private
 */
exports.deleteReview = asyncErrorHandler(async (req, res, next) => {
  try {
    // Find the product by ID
    const productId = req.params.id;
    const product = await ProductModel.findById(productId);

    // Check if the product exists
    if (!product) {
      return next(new ErrorHandler("Product not found", 404)); 
    }

    // Find the index of the review to delete
    const reviewIndex = product.reviews.findIndex(
      (rev) => rev._id.toString() === req.query.id.toString()
    );

    // Check if the review exists
    if (reviewIndex === -1) {
      return next(new ErrorHandler("Review not found", 404)); 
    }

    // Remove the review from the reviews array
    product.reviews.splice(reviewIndex, 1);

    // Update the product's ratings and number of reviews
    let totalRatings = 0;
    product.reviews.forEach((rev) => {
      totalRatings += rev.ratings;
    });

    product.ratings = product.reviews.length > 0 ? totalRatings / product.reviews.length : 0;
    product.numOfReviews = product.reviews.length;

    // Save the updated product
    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    // Handle any errors that occur
    return next(new ErrorHandler("Failed to delete review", 500));
  }
});


/**
 * @route   GET /api/products/category/:category
 * @desc    Get products by category
 * @access  Public
 */
exports.getProductsByCategory = asyncErrorHandler(async (req, res, next) => {
  try {
      const category = req.params.category;

      // Validate category input
      if (!category) {
          return next(new ErrorHandler('Category parameter is missing', 400));
      }

      // Find products by category
      const products = await ProductModel.find({ category: category });

      // Check if products were found
      if (!products || products.length === 0) {
          return next(new ErrorHandler(`No products found for category: ${category}`, 404));
      }

      // Send success response with products
      res.status(200).json({
          success: true,
          products: products,
      });
  } catch (error) {
      // Handle any errors that occur
      return next(new ErrorHandler('Failed to fetch products by category', 500));
  }
});


/**
 * @route   GET /api/products/brand/:brand
 * @desc    Get products by brand
 * @access  Public
 */
exports.getProductsByBrand = asyncErrorHandler(async (req, res, next) => {
  try {
      const brandName = req.params.brand;

      // Validate brand name input
      if (!brandName) {
          return next(new ErrorHandler('Brand parameter is missing', 400));
      }

      // Find products by brand name
      const products = await ProductModel.find({ "brand.name": brandName });

      // Check if products were found
      if (!products || products.length === 0) {
          return next(new ErrorHandler(`No products found for brand: ${brandName}`, 404));
      }

      // Send success response with products
      res.status(200).json({
          success: true,
          products: products,
      });
  } catch (error) {
      // Handle any errors that occur
      return next(new ErrorHandler('Failed to fetch products by brand', 500));
  }
});


exports.getTopRatedProducts = asyncErrorHandler( async (req, res, next) => {
  try {
    // Fetch top-rated products by sorting them in descending order of ratings and limiting to 10
    const topRatedProducts = await ProductModel.find().sort({ ratings: -1 }).limit(10);

    if (!topRatedProducts || topRatedProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No top-rated products found"
      });
    }

    // If top-rated products are found, send them in the response
    res.status(200).json({
      success: true,
      products: topRatedProducts
    });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Failed to fetch top-rated products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top-rated products"
    });
  }
});

exports.getRelatedProducts = asyncErrorHandler(async (req, res, next) => {
  const productId = req.params.id;

  try {
    // Find the product by its ID
    const product = await ProductModel.findById(productId);

    // If the product is not found, return a 404 error
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find related products by the same category, excluding the current product, and select 4 random products
    const relatedProducts = await ProductModel.aggregate([
      { $match: { category: product.category, _id: { $ne: productId } } },
      { $sample: { size: 4 } }
    ]);

    res.status(200).json({
      success: true,
      products: relatedProducts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
/**
 * @route   GET /api/products/price-range
 * @desc    Get products by price range
 * @access  Public
 */
exports.getProductsByPriceRange = async (req, res) => {
  try {
      const { minPrice, maxPrice } = req.query;

      // Validate query parameters
      if (!minPrice || !maxPrice || isNaN(minPrice) || isNaN(maxPrice)) {
          return res.status(400).json({
              success: false,
              error: {
                  message: "Invalid price range parameters",
                  statusCode: 400
              }
          });
      }

      const products = await ProductModel.find({
          price: { $gte: minPrice, $lte: maxPrice }
      });

      res.status(200).json({
          success: true,
          products: products,
      });
  } catch (error) {
      console.error("Failed to fetch product details:", error);
      res.status(500).json({
          success: false,
          error: {
              message: "Failed to fetch product details",
              statusCode: 500
          }
      });
  }
};
/**
 * @route   GET /api/products/search
 * @desc    Get products by search query
 * @access  Public
 */
exports.searchProducts = async (req, res, next) => {
  try {
    
    const apiFeature = new SearchFeatures(ProductModel.find(), req.query)
      .fuzzySearch() // Apply search filter based on the query parameters
      .filter(); // Apply additional filters based on the query parameters
  
    let products = await apiFeature.query; // Fetch the products based on the applied filters and search
  
    res.status(200).json({
      success: true,
      products: products,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500)); // Handle any errors
  }
};


/**
 * @route   GET /api/products/category/:category/count
 * @desc    Get product count by category
 * @access  Public
 */
exports.getProductCountByCategory = asyncErrorHandler(async (req, res, next) => {
    const category = req.params.category;
    const productCount = await ProductModel.countDocuments({ category: category });

    res.status(200).json({
        success: true,
        productCount: productCount,
    });
});


// Brand Controller

// Function to create a brand
exports.createBrand = async (req, res, next) => {
  try {
    const { title, description} = req.body;
    const picture = req.files.picture 

    // Check if picture file is provided
    if (!picture) {
      return next(new ErrorHandler('No picture file provided', 400));
    }

    // Upload picture to Cloudinary
    const result = await cloudinary.v2.uploader.upload(picture.tempFilePath
      , { folder: 'Brand' });

    // Create brand with picture URL from Cloudinary
    const brand = await Brand.create({ title, description, picture: { public_id: result.public_id, url: result.secure_url } });

    // Send success response
    res.status(201).json({ success: true, brand });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
  }
};

exports.getAllBrands = async (req, res, next) => {
  try {
    // Find all brands
    const brands = await Brand.find();

    // Send response with the list of brands
    res.status(200).json({ success: true, brands });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
};

// Function to update a brand
exports.updateBrand = async (req, res, next) => {
  try {
      const { id } = req.params;
      const { title, description } = req.body;
      const picture = req.files ? req.files.picture : null;

      // Find the brand by ID
      let brand = await Brand.findById(id);

      // Check if brand exists
      if (!brand) {
          return res.status(404).json({ success: false, message: 'Brand not found' });
      }

      // Update brand with new title and description
      if (title) { brand.title = title };
      if (description) { brand.description = description };

      // Check if picture file is provided
      if (picture) {
          // If brand has an old picture, delete it from Cloudinary
          if (brand.picture && brand.picture.public_id) {
              await cloudinary.uploader.destroy(brand.picture.public_id);
          }

          // Upload new picture to Cloudinary with folder specified
          const result = await cloudinary.uploader.upload(picture.tempFilePath, { folder: 'Brand' });

          // Update brand with new picture URL from Cloudinary
          brand.picture = { public_id: result.public_id, url: result.secure_url };
      }

      // Save the updated brand
      await brand.save();

      // Send response with updated brand
      res.status(200).json({ success: true, brand });
  } catch (error) {
      next(error); // Pass error to error handling middleware
  }
};


exports.getAllBrands = async (req, res, next) => {
  try {
    // Find all brands
    const brands = await Brand.find();

    // Send response with the list of brands
    res.status(200).json({ success: true, brands });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
};

exports.deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the brand by ID
    const brand = await Brand.findById(id);

    // If brand has a picture, delete it from Cloudinary
    if (brand.picture && brand.picture.public_id) {
      await cloudinary.v2.uploader.destroy(brand.picture.public_id);
    }

    // Delete the brand from the database
    await Brand.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Brand deleted successfully' });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
  }
};
// Category Controller

exports.createCategory = async (req, res, next) => {
  try {
    const { title} = req.body;
    const  image = req.files.image
    let category;

    if (image) {
      // Upload image to Cloudinary
      const result = await cloudinary.v2.uploader.upload(image.tempFilePath, {
        folder: 'category_images', // Specify the folder in Cloudinary to store category images
        // width: 150,
        // crop: 'scale',
      
      });
      
      // Create category with image URL
      category = await Category.create({ title, image: { public_id: result.public_id, url: result.secure_url } });
    } else {
      // If no image provided, create category without image
      category = await Category.create({ title });
    }

    res.status(201).json({ success: true, category });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const image = req.files ? req.files.images : null; // Check if req.files exists before accessing its properties
    let updatedCategory;

    const existingCategory = await Category.findById(id);

    if (!existingCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (image) { // Check if image is provided
      const result = await cloudinary.v2.uploader.upload(image.tempFilePath, {
        folder: 'category_images'
      });

      if (existingCategory.image && existingCategory.image.public_id) {
        await cloudinary.v2.uploader.destroy(existingCategory.image.public_id);
      }

      updatedCategory = await Category.findByIdAndUpdate(
        id,
        { title, image: { public_id: result.public_id, url: result.secure_url } },
        { new: true }
      );
    } else {
      // If no new image is provided, update the category without changing the image
      updatedCategory = await Category.findByIdAndUpdate(id, { title }, { new: true });
    }

    res.status(200).json({ success: true, category: updatedCategory });
  } catch (error) {
    next(error); // Pass the error to the error handler middleware
  }
};

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    if (!categories || categories.length === 0) {
      return res.status(404).json({ success: false, message: 'No categories found' });
    }
    
    // Map categories to include image URLs
    const categoriesWithImages = categories.map(category => ({
      _id: category._id,
      title: category.title,
      image: category.image ? category.image : null // Include image URL if exists, otherwise null
    }));

    res.status(200).json({ success: true, categories: categoriesWithImages });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the category to be deleted
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // If the deleted category had an image, delete it from Cloudinary
    if (deletedCategory.image && deletedCategory.image.public_id) {
      await cloudinary.v2.uploader.destroy(deletedCategory.image.public_id);
    }

    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
  }
}
// Coupon Controller

// Create a new coupon
exports.createCoupon = async (req, res, next) => {
  try {
    const { name, expiry, discount,validateamount,description } = req.body;
    const coupon = await Coupon.create({ name, expiry, discount,validateamount,description });
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
  }
};

// Get all coupons
exports.getAllCoupons = asyncErrorHandler(async (req, res, next) => {
  const coupons = await Coupon.find().clone();
  res.status(200).json({ success: true, coupons });
});

// Update a coupon by ID
exports.updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, expiry, discount,validateamount,description } = req.body;
    const updatedCoupon = await Coupon.findByIdAndUpdate(id, { name, expiry, discount,validateamount,description }, { new: true });
    if (!updatedCoupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.status(200).json({ success: true, coupon: updatedCoupon });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
  }
};

// Delete a coupon by ID
exports.deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedCoupon = await Coupon.findByIdAndDelete(id);
    if (!deletedCoupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
  }
};

// productController.js

/**
 * @route   GET /api/products/highlights/:highlight
 * @desc    Get products by highlight
 * @access  Public
 */
exports.getProductsByHighlight = asyncErrorHandler(async (req, res, next) => {
  try {
      const highlight = req.params.highlight;

      // Validate highlight input
      if (!highlight) {
          return next(new ErrorHandler('Highlight parameter is missing', 400));
      }

      // Find products by highlight
      const products = await ProductModel.find({ highlights: highlight }).limit(10);

      // Check if products were found
      if (!products || products.length === 0) {
          return next(new ErrorHandler(`No products found for highlight: ${highlight}`, 404));
      }

      // Send success response with products
      res.status(200).json({
          success: true,
          products: products,
      });
  } catch (error) {
      // Handle any errors that occur
      return next(new ErrorHandler('Failed to fetch products by highlight', 500));
  }
});

/**
 * @route   GET /api/products/recommendations
 * @desc    Get random product recommendations
 * @access  Public
 */
exports.getRandomProductRecommendations = asyncErrorHandler(async (req, res, next) => {
  try {
    // Fetch all products from the database
    const allProducts = await ProductModel.find();

    // Check if there are enough products available
    if (allProducts.length < 8) {
      return res.status(400).json({ success: false, message: "Not enough products available for recommendations" });
    }

    // Shuffle the array of products
    const shuffledProducts = shuffleArray(allProducts);

    // Select the first 8 products as recommendations
    const recommendations = shuffledProducts.slice(0, 8);

    // Send success response with recommendations
    res.status(200).json({ success: true, recommendations });
  } catch (error) {
    // Handle any errors that occur
    return next(new ErrorHandler('Failed to fetch random product recommendations', 500));
  }
});

// Function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
// productController.js

/**
 * @route   GET /api/products/reviews/landing-page
 * @desc    Get reviews to show on landing page
 * @access  Public
 */
exports.getReviewsForLandingPage = asyncErrorHandler(async (req, res, next) => {
  try {
    const reviews = await ProductModel.aggregate([
      { $unwind: '$reviews' }, // Deconstruct the reviews array
      { $match: { 'reviews.showOnLandingPage': true } }, // Filter reviews that should be shown on landing page
      { $project: { _id: 0, reviews: 1 } } // Project only the reviews field
    ]);

    // Extract the reviews from the result
    const landingPageReviews = reviews.map(r => r.reviews);

    // Check if reviews were found
    if (!landingPageReviews || landingPageReviews.length === 0) {
      return next(new ErrorHandler('No reviews found for landing page', 404));
    }

    // Send success response with reviews
    res.status(200).json({
      success: true,
      reviews: landingPageReviews,
    });
  } catch (error) {
    // Handle any errors that occur
    return next(new ErrorHandler('Failed to fetch reviews for landing page', 500));
  }
});

exports.getAllProductReviews = async (req, res) => {
  try {
    // Find all products and populate the 'user' field in reviews
    const products = await ProductModel.find({}, 'name reviews')
      .populate({
        path: 'reviews.user',
        select: 'name email avatar' // Select the fields you want from the user model
      });

    // Extract reviews from the products
    const allReviews = products.reduce((accumulator, product) => {
      const productReviews = product.reviews.map(review => ({
        productId: product._id,
        productName: product.name,
        review: review,
        user: review.user // Populated user info
      }));
      return accumulator.concat(productReviews);
    }, []);

    // Send success response with all reviews
    res.status(200).json({
      success: true,
      reviews: allReviews,
    });
  } catch (error) {
    // Handle any errors that occur
    res.status(500).json({ success: false, message: 'Failed to fetch all product reviews' });
  }
};
exports.deleteProductImage = async (productId, imageId) => {
  try {
    const product = await ProductModel.findById(productId);

    if (!product) {
      return { success: false, message: "Product not found" };
    }

    // Ensure imageId and _id are treated as strings for comparison
    const indexToDelete = product.images.findIndex(image => image._id.toString() === imageId.toString());

    if (indexToDelete === -1) {
      return { success: false, message: "Image not found in product" };
    }

    // Delete image from Cloudinary
    const deletedImage = await cloudinary.uploader.destroy(product.images[indexToDelete].public_id);

    if (deletedImage.result !== 'ok') {
      return { success: false, message: "Error deleting image from Cloudinary" };
    }

    product.images.splice(indexToDelete, 1);
    await product.save();

    return { success: true, message: "Image deleted successfully" };
  } catch (error) {
    console.error("Error deleting product image:", error);
    return { success: false, message: "An error occurred while deleting the image" };
  }
};

exports.updateProductReview = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const reviewId = req.params.reviewId;
    const { rating, comment,showOnLandingPage } = req.body;

    // Find the product by ID
    const product = await ProductModel.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Find the review by ID
    const review = product.reviews.id(reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Update the review properties
    if (rating) {
      review.rating = rating;
    }

    if (comment) {
      review.comment = comment;
    }
    if(showOnLandingPage){
      review.showOnLandingPage=showOnLandingPage;
    }

    // Save the updated product
    await product.save();

    res.status(200).json({ success: true, message: 'Review updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update review' });
  }
};
// Delete review by review ID
exports.deleteReviewById = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    // Find the product that contains the review
    const product = await  ProductModel.findOne({ 'reviews._id': reviewId });
    if (!product) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Find the review index in the reviews array
    const reviewIndex = product.reviews.findIndex(review => review._id.toString() === reviewId);
    if (reviewIndex === -1) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Remove the review from the reviews array
    product.reviews.splice(reviewIndex, 1);

    // Update the number of reviews and ratings
    product.numOfReviews = product.reviews.length;
    product.ratings = product.reviews.length
      ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
      : 0;

    // Save the updated product
    await product.save();

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Update showOnLandingPage value by review ID
exports.updateShowOnLandingPage = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { showOnLandingPage } = req.body;

    // Find the product that contains the review
    const product = await  ProductModel.findOne({ 'reviews._id': reviewId });
    if (!product) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Find the review in the reviews array
    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Update the showOnLandingPage value
    review.showOnLandingPage = showOnLandingPage;

    // Save the updated product
    await product.save();

    res.status(200).json({ message: 'showOnLandingPage value updated successfully' });
  } catch (error) {
    console.error('Error updating showOnLandingPage:', error);
    res.status(500).json({ message: 'Internal server error' });
  }};














  exports.createMaterial = async (req, res, next) => {
    try {
      const { title} = req.body;
      let material;     // If no image provided, create category without image
      material= await Material.create({ title });
      res.status(201).json({ success: true, material });
    } catch (error) {
      next(new ErrorHandler(error.message, 400));
    }
  };
  
  exports.updateMaterial = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title } = req.body;
      let updatedMaterial;
  
      const existingMaterial = await Material.findById(id);
  
      if (!existingMaterial) {
        return res.status(404).json({ success: false, message: 'Material not found' });
      }
      updatedMaterial = await Material.findByIdAndUpdate(id, { title }, { new: true });

      res.status(200).json({ success: true, material: updatedMaterial});
    } catch (error) {
      next(error); // Pass the error to the error handler middleware
    }
  };
  
  exports.getAllMaterials = async (req, res, next) => {
    try {
      const materials = await Material.find();
      if (!materials|| materials.length === 0) {
        return res.status(404).json({ success: false, message: 'No materials found' });
      }
      
      // Map categories to include image URLs
      const materialsWith= materials.map(material => ({
        _id: material._id,
        title: material.title,
      }));
  
      res.status(200).json({ success: true, materials: materialsWith });
    } catch (error) {
      next(new ErrorHandler(error.message, 500));
    }
  };
  
  exports.deleteMaterial = async (req, res, next) => {
    try {
      const { id } = req.params;
  
      // Find the category to be deleted
      const deletedMaterial = await Material.findByIdAndDelete(id);
  
      if (!deletedMaterial) {
        return res.status(404).json({ success: false, message: 'Material not found' });
      }
  
      res.status(200).json({ success: true, message: 'Material deleted successfully' });
    } catch (error) {
      next(new ErrorHandler(error.message, 400));
    }
  }