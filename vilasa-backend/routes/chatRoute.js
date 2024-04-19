const express = require('express');
const router = express.Router();
const { isAuthenticatedUser } = require('../middleware/auth');
const { createChatMessage, getEnquiryChatMessages, markChatForDeletion } = require('../controllers/chatController');

router.route('/chats')
  .post(isAuthenticatedUser, createChatMessage);

router.route('/enquiries/:enquiryId/chats')
  .get(isAuthenticatedUser, getEnquiryChatMessages);

  router.route('/chats/:chatId/mark-deletion')
  .put(isAuthenticatedUser,markChatForDeletion);

module.exports = router;
