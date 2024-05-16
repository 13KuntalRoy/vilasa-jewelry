const Enquiry = require('../model/Enquiry');
const Chat = require('../model/ChatModel')
// Create a new enquiry
const createEnquiry = async (req, res, next) => {
  const {subject, message } = req.body;
  const user = req.user._id

  try {
    // Validate the request
    if (!user || !subject || !message) {
      return res.status(400).json({ success: false, message: 'User, subject, and message are required fields.' });
    }

    // Create enquiry object
    const newEnquiry = await Enquiry.create({
      user,
      subject,
      message,
      // You can include other fields here as needed, such as admin, status, etc.
    });

    // Respond with success message and the created enquiry object
    res.status(201).json({ success: true, data: newEnquiry });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Get all enquiries
const getAllEnquiries = async (req, res, next) => {
    try {
      // Retrieve all enquiries from the database
      const enquiries = await Enquiry.find();
  
      // Respond with the retrieved enquiries
      res.status(200).json({ success: true, count: enquiries.length, data: enquiries });
    } catch (error) {
      // Handle errors
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  };
// Get enquiries for the authenticated user
const getOwnEnquiries = async (req, res, next) => {
    try {
      // Retrieve enquiries associated with the authenticated user
      const enquiries = await Enquiry.find({ user: req.user._id });
  
      // Respond with the retrieved enquiries
      res.status(200).json({ success: true, count: enquiries.length, data: enquiries });
    } catch (error) {
      // Handle errors
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  };
  // Delete an enquiry by ID
  const deleteEnquiry = async (req, res, next) => {
    const { enquiryId } = req.params;
  
    try {
      // Log the enquiryId before deletion to verify its value
      console.log('Deleting enquiry with ID:', enquiryId);
  
      // Find the enquiry by ID and delete it
      const deletedEnquiry = await Enquiry.findByIdAndDelete(enquiryId);
  
      // Check if deletedEnquiry is falsy, indicating deletion failure
      if (!deletedEnquiry) {
        // Log an error and return a response indicating enquiry not found
        console.log('Enquiry not found with ID:', enquiryId);
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
      }
  
      // Delete associated chat messages
      await Chat.deleteMany({ enquiry: enquiryId });
  
      // Respond with success message and the deleted enquiry
      return res.status(200).json({ success: true, message: 'Enquiry and associated chat messages deleted successfully.', data: deletedEnquiry });
    } catch (error) {
      // Log and handle any errors that occur during the deletion process
      console.error('Error deleting enquiry:', error);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  };
  

  
const getEnquiryById = async (req, res, next) => {
  const { enquiryId } = req.params;

  try {
    // Find the enquiry by ID
    const enquiry = await Enquiry.findById(enquiryId);

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    // Respond with the retrieved enquiry
    res.status(200).json({ success: true, data: enquiry });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { createEnquiry, getAllEnquiries, getOwnEnquiries, deleteEnquiry, getEnquiryById };

