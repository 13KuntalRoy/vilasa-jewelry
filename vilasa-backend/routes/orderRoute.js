const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
router.route('/new').post(isAuthenticatedUser, orderController.newOrder);
router.route('/:id/return').post(isAuthenticatedUser, orderController.initiateReturn);
router.route('/:id/return/process').put(isAuthenticatedUser, orderController.processReturn);
router.route('/:id').get(isAuthenticatedUser, orderController.getSingleOrderDetails);
router.route('/myorders/order').get(isAuthenticatedUser, orderController.myOrders);
router.route('/admin/all').get(isAuthenticatedUser, authorizeRoles ('admin'), orderController.getAllOrders);
router.route('/admin/update/:id').put(isAuthenticatedUser, authorizeRoles ('admin'), orderController.updateOrder);
router.route('/admin/delete/:id').delete(isAuthenticatedUser, authorizeRoles ('admin'), orderController.deleteOrder);
router.route('/:id/return/update').put(isAuthenticatedUser, authorizeRoles('admin'), orderController.updateReturnStatus);



module.exports = router;

