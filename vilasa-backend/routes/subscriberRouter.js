const express = require('express');
const router = express.Router();
const { addSubscriber, getAllSubscribers, downloadSubscribersAsExcel } = require('../controllers/subscriberController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

// Define routes
router.route('/subscribe').post(addSubscriber);
router.route('/subscribers').get(isAuthenticatedUser, authorizeRoles('admin'), getAllSubscribers);

module.exports = router;
