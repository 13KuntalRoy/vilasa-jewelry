const express = require('express');
const router = express.Router();
const { createContact, updateEnquiryStatus, deleteEnquiry, getAllContacts } = require('../controllers/contactController');

router.route('/contact')
  .post(createContact)
  .get(getAllContacts);

router.route('/contact/:id/enquiry-status')
  .put(updateEnquiryStatus);

router.route('/contact/:id')
  .delete(deleteEnquiry);

module.exports = router;
