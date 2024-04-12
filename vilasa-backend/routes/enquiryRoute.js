const express = require('express');
const router = express.Router();
const { isAuthenticatedUser } = require('../middleware/auth');
const { createEnquiry, getAllEnquiries, getOwnEnquiries,deleteEnquiry, getEnquiryById } = require('../controllers/enquiryController');

router.route('/enquiries')
    .post(isAuthenticatedUser, createEnquiry) // Route for creating a new enquiry
    .get(isAuthenticatedUser, getAllEnquiries); // Route for getting all enquiries (accessible only to admin users)

router.route('/enquiries/own')
    .get(isAuthenticatedUser, getOwnEnquiries); // Route for getting authenticated user's own enquiries

router.route('/enquiries/:enquiryId')
    .delete(isAuthenticatedUser, deleteEnquiry)
    .get(isAuthenticatedUser, getEnquiryById);

module.exports = router;
