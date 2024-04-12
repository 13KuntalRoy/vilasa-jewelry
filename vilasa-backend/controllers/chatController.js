const Chat = require("../model/ChatModel");
const asyncHandler =  require('../middleware/asyncErrorHandler');
const cloudinary = require('cloudinary').v2;


// Create a new chat message with optional image upload
const createChatMessage = asyncHandler(async (req, res) => {
  const { sender, receiver, enquiry, message, senderRole, picture } = req.body;

  // If picture is included in the request body, upload it to Cloudinary
  let pictureUrl = null;
  if (picture) {
    try {
      const result = await cloudinary.uploader.upload(picture, { folder: 'chat_images' });
      pictureUrl = result.secure_url; // Get the Cloudinary URL of the uploaded image
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      return res.status(500).json({ message: 'Failed to upload image to Cloudinary.' });
    }
  }

  try {
    // Create the chat message with the Cloudinary image URL
    const newChat = await Chat.create({ sender, receiver, enquiry, message, senderRole, picture: pictureUrl });
    res.status(201).json(newChat);
  } catch (error) {
    console.error('Error creating chat message:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get all chat messages for a specific enquiry
const getEnquiryChatMessages = asyncHandler(async (req, res) => {
  const { enquiryId } = req.params;
  try {
    const chatMessages = await Chat.find({ enquiry: enquiryId }).sort({ createdAt: 1 });
    
    // Map over the chat messages and replace the picture path with the Cloudinary URL
    const chatMessagesWithImageUrl = await Promise.all(chatMessages.map(async (message) => {
      if (message.picture) {
        // Assuming message.picture contains the Cloudinary image ID or URL
        // You may need to adjust this based on how you store the image data
        const imageUrl = await cloudinary.url(message.picture); // Get the Cloudinary URL
        // Return the message with the Cloudinary URL replaced
        return { ...message.toObject(), picture: imageUrl };
      }
      return message.toObject(); // Return the message as is if no picture is present
    }));

    res.json(chatMessagesWithImageUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});



// Mark chat message for deletion
const markChatForDeletion = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    try {
      // Find the chat message by ID and update its fields
      const chat = await Chat.findByIdAndUpdate(chatId, { markedForDeletion: true, deletionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) }, { new: true });
      if (!chat) {
        return res.status(404).json({ message: 'Chat message not found.' });
      }
      res.status(200).json({ message: 'Chat message marked for deletion.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });



  module.exports = {
    createChatMessage,
    getEnquiryChatMessages,
    markChatForDeletion
  };
  
  