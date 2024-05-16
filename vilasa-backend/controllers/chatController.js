const Chat = require("../model/ChatModel");
const asyncHandler =  require('../middleware/asyncErrorHandler');
const cloudinary = require('cloudinary').v2;


// Create a new chat message with optional image upload
const createChatMessage = asyncHandler(async (req, res) => {
  const { receiver, enquiry, message} = req.body;
  const sender = req.user._id;
  const senderRole = req.user.role;
  const  picture = req.files.picture;

  console.log(req.user);


  // If picture is included in the request body, upload it to Cloudinary
  let pictureUrl = null;
  if (picture) {
    try {
      const result = await cloudinary.uploader.upload(picture.tempFilePath, { folder: 'chat_images' });
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



// Mark all chat messages with Sam's sender ID and a specific enquiry ID for deletion
const markChatForDeletion = asyncHandler(async (req, res) => {
  const { enquiryId } = req.params;
  try {
    // Find all chat messages with the specified enquiry ID and sender "Sam"
    const chatMessages = await Chat.find({ enquiry: enquiryId, sender: { $eq: 'Sam' } });
    if (!chatMessages || chatMessages.length === 0) {
      return res.status(404).json({ message: 'No chat messages found for Sam with the specified enquiry.' });
    }
    
    // Iterate over each chat message found
    for (const chat of chatMessages) {
      // If the chat message has a picture, delete it from Cloudinary
      if (chat.picture) {
        // Extract the image public ID from the Cloudinary URL
        const publicId = chat.picture.split('/').pop().split('.')[0];
        
        // Delete the image from Cloudinary
        await cloudinary.uploader.destroy(publicId);
      }
      
      // Update the chat message to mark it for deletion
      chat.markedForDeletion = true;
      chat.deletionDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      await chat.save();
    }

    res.status(200).json({ message: 'All chat messages for Sam with the specified enquiry marked for deletion.' });
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
  
  