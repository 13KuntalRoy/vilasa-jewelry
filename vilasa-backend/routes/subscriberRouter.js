const express = require('express');
const router = express.Router();
const { addSubscriber, getAllSubscribers, downloadSubscribersAsExcel } = require('../controllers/subscriberController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

// Define routes
router.route('/subscribe').post(addSubscriber);
router.route('/subscribers').get(isAuthenticatedUser, authorizeRoles('admin'), getAllSubscribers);
router.route('/subscribers/download').get(isAuthenticatedUser, authorizeRoles('admin'), downloadSubscribersAsExcel);

module.exports = router;
