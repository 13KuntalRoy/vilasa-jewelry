const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const asyncErrorHandler = require("../middleware/asyncErrorHandler");
const {
    createProduct,
    getAllProducts,
    getAllProductsAdmin,
    updateProduct,
    deleteProduct,
    getProductDetails,
    createProductReview,
    getProductReviews,
    deleteReview,
    getProductsByCategory,
    getProductsByBrand,
    getTopRatedProducts,
    getRelatedProducts,
    getProductsByPriceRange,
    searchProducts,
    getProductCountByCategory,
    createCategory,
    getAllCategories,
    createCoupon,
    getAllCoupons,
    createBrand,
    getAllBrands,
    updateBrand,
    deleteBrand,
    updateCategory,
    deleteCategory,
    updateCoupon,
    deleteCoupon,
    getProductsByHighlight,
    getRandomProductRecommendations,
    getReviewsForLandingPage,
    getAllProductReviews,
    deleteProductImage,
    updateProductReview,
    addProductImage,
    addProductSpecification,
    deleteProductSpecification,
    addProductHighlight,
    deleteProductHighlight,
    deleteReviewById
} = require('../controllers/productController');

// Routes for products
router.route('/products')
    .post(isAuthenticatedUser, createProduct)
    .get( getAllProducts);

router.route('/products/admin')
    .get(isAuthenticatedUser, authorizeRoles('admin'), getAllProductsAdmin);

router.route('/products/:id')
    .put(isAuthenticatedUser, updateProduct)
    .delete(isAuthenticatedUser, deleteProduct)
    .get( getProductDetails);

router.route('/products/:id/reviews')
    .post(isAuthenticatedUser, createProductReview)
    .get(isAuthenticatedUser, getProductReviews)
    .delete(isAuthenticatedUser, deleteReview);

router.route('/products/category/:category')
    .get( getProductsByCategory);

router.route('/products/brand/:brand')
    .get( getProductsByBrand);

router.route('/products/top-rated/product')
    .get(getTopRatedProducts);

router.route('/products/related/:id')
    .get( getRelatedProducts);

router.route('/products/price-range/search')
    .get( getProductsByPriceRange);

router.route('/products-search/search')
    .get( searchProducts);

router.route('/products/category/:category/count')
    .get(getProductCountByCategory);

// Routes for categories
router.route('/categories')
    .post(isAuthenticatedUser, authorizeRoles('admin'), createCategory)
    .get(getAllCategories);

// Routes for coupons
router.route('/coupons')
    .post(isAuthenticatedUser, authorizeRoles('admin'), createCoupon)
    .get(isAuthenticatedUser, getAllCoupons);

// Routes for brands
router.route('/brands')
    .post(isAuthenticatedUser, authorizeRoles('admin'), createBrand)
    .get(isAuthenticatedUser, getAllBrands);


router.route('/brands/:id')
  .put(isAuthenticatedUser, authorizeRoles('admin'),updateBrand)
  .delete(isAuthenticatedUser, authorizeRoles('admin'),deleteBrand);


router.route('/categories/:id')
  .put(isAuthenticatedUser, authorizeRoles('admin'),updateCategory)
  .delete(isAuthenticatedUser, authorizeRoles('admin'),deleteCategory);

// Coupons Routes
router.route('/coupons')
  .post(isAuthenticatedUser, authorizeRoles('admin'),createCoupon)
  .get(isAuthenticatedUser,getAllCoupons);

router.route('/coupons/:id')
  .put(isAuthenticatedUser, authorizeRoles('admin'),updateCoupon)
  .delete(isAuthenticatedUser, authorizeRoles('admin'),deleteCoupon);

router.route('/highlights/:highlight').get(getProductsByHighlight);

router.route('/recommendations')
  .get( getRandomProductRecommendations);

router.route('/reviews/landing-page')
  .get(getReviewsForLandingPage)

router.route('/allreviews')
  .get(isAuthenticatedUser,authorizeRoles('admin'),getAllProductReviews)

  router.route('/:productId/images/:imageId')
  .delete(asyncErrorHandler(async (req, res, next) => {
      const productId = req.params.productId;
      const imageId = req.params.imageId;

      const result = await deleteProductImage(productId, imageId);

      if (result.success) {
          res.status(200).json({ success: true, message: result.message });
      } else {
          res.status(400).json({ success: false, message: result.message });
      }
  }));

router.route('/products/:productId/reviews/:reviewId')
  .put(updateProductReview)

// Add Image to Product
router.route('/product/:id/image')
    .put(addProductImage);

// Add Specification to Product
router.route('/product/:id/specification')
    .put(addProductSpecification);

// Delete Specification from Product
router.route('/product/:id/specification/:specId')
    .delete(deleteProductSpecification);

// Add Highlight to Product
router.route('/product/:id/highlight')
    .put(addProductHighlight);

// Delete Highlight from Product
router.route('/product/:id/highlight/:highlight')
    .delete(deleteProductHighlight);

router.delete('/review/:reviewId', isAuthenticatedUser,authorizeRoles('admin'), deleteReviewById);

module.exports = router;
