const Contact = require('../model/Contact');

// Create a new contact
async function createContact(req, res) {
  try {
    const { name, email, message } = req.body;
    // Create a new Contact document
    const newContact = new Contact({ name, email, message, enquiryStatus: 'Pending' });
    // Save the document to the database
    await newContact.save();
    res.status(201).json({ message: 'Contact created successfully', contact: newContact });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating contact' });
  }
}

// Update enquiry status
async function updateEnquiryStatus(req, res) {
  try {
    const { id } = req.params;
    const { enquiryStatus } = req.body;
    const updatedContact = await Contact.findByIdAndUpdate(id, { enquiryStatus }, { new: true });
    if (!updatedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ message: 'Enquiry status updated successfully', contact: updatedContact });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating enquiry status' });
  }
}

// Delete enquiry
async function deleteEnquiry(req, res) {
  try {
    const { id } = req.params;
    const deletedContact = await Contact.findByIdAndDelete(id);
    if (!deletedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted successfully', contact: deletedContact });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting contact' });
  }
}

// Controller function to get all contacts
async function getAllContacts(req, res) {
    try {
      // Query all contacts from the database
      const contacts = await Contact.find();
      res.json({ contacts });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching contacts' });
    }
  }
  
module.exports = { createContact, updateEnquiryStatus, deleteEnquiry, getAllContacts };


