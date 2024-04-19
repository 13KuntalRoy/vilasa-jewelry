const About = require('../models/about');
const cloudinary = require('cloudinary').v2;

// Create a new about (with image upload to Cloudinary)
async function createAbout(req, res) {
  try {
    const { name, designation } = req.body;
    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);
    const newAbout = new About({ name, designation, picture: result.secure_url, picture_id: result.public_id });
    await newAbout.save();
    res.status(201).json({ message: 'About created successfully', about: newAbout });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating about' });
  }
}

// Update about (with image re-upload to Cloudinary)
async function updateAbout(req, res) {
  try {
    const { id } = req.params;
    const { name, designation } = req.body;
    const about = await About.findById(id);
    if (!about) {
      return res.status(404).json({ error: 'About not found' });
    }
    // Delete existing image from Cloudinary
    await cloudinary.uploader.destroy(about.picture_id);
    // Upload new image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);
    // Update about with new data
    about.name = name;
    about.designation = designation;
    about.picture = result.secure_url;
    about.picture_id = result.public_id;
    await about.save();
    res.json({ message: 'About updated successfully', about });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating about' });
  }
}

// Delete about (with image deletion from Cloudinary)
async function deleteAbout(req, res) {
  try {
    const { id } = req.params;
    const about = await About.findById(id);
    if (!about) {
      return res.status(404).json({ error: 'About not found' });
    }
    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(about.picture_id);
    // Delete about from database
    await about.remove();
    res.json({ message: 'About deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting about' });
  }
}

// Get all abouts
async function getAllAbouts(req, res) {
  try {
    const abouts = await About.find();
    res.json({ abouts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching abouts' });
  }
}

module.exports = { createAbout, updateAbout, deleteAbout, getAllAbouts };
