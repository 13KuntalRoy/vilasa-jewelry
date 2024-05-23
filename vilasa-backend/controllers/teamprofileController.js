const cloudinary = require('cloudinary').v2;
const TeamProfile = require('../model/TeamProfile');

// Create TeamProfile document with avatar
async function createTeamProfile(req, res) {
  try {
    const { name, designation } = req.body;
    const image = req.files.avatar
    const uploadedImage = await cloudinary.uploader.upload(image.tempFilePath);
    const teamProfile = new TeamProfile({
      name,
      designation,
      avatar: {
        public_id: uploadedImage.public_id,
        url: uploadedImage.url
      }
    });
    await teamProfile.save();
    res.status(201).json({ success: true, message: "Team profile created successfully" });
  } catch (error) {
    console.error("Error creating TeamProfile:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Update TeamProfile document with new avatar
async function updateTeamProfile(req, res) {
  try {
    const { id } = req.params;
    const { name, designation } = req.body;
    
    let avatar;
    if (req.files && req.files.avatar) {
      avatar = req.files.avatar;
      // Delete previous image from Cloudinary
      await cloudinary.uploader.destroy(teamProfile.avatar.public_id);
      // Upload new image
      const uploadedImage = await cloudinary.uploader.upload(avatar.tempFilePath);
      avatar = {
        public_id: uploadedImage.public_id,
        url: uploadedImage.url
      };
    }

    const teamProfile = await TeamProfile.findById(id);
    if (!teamProfile) throw new Error('TeamProfile not found');

    // Update TeamProfile document
    teamProfile.name = name;
    teamProfile.designation = designation;
    
    // Assign avatar if it exists
    if (avatar) {
      teamProfile.avatar = avatar;
    }

    await teamProfile.save();
    res.json({ success: true, message: "Team profile updated successfully" });
  } catch (error) {
    console.error("Error updating TeamProfile:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Delete TeamProfile document and associated avatar from Cloudinary
async function deleteTeamProfile(req, res) {
  try {
    const { id } = req.params;
    const teamProfile = await TeamProfile.findById(id);
    if (!teamProfile) throw new Error('TeamProfile not found');
    
    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(teamProfile.avatar.public_id);

    // Delete TeamProfile document from MongoDB
    await teamProfile.remove();
    res.json({ success: true, message: "Team profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting TeamProfile:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get all TeamProfile documents
async function getAllTeamProfiles(req, res) {
  try {
    const teamProfiles = await TeamProfile.find();
    res.json({ success: true, data: teamProfiles });
  } catch (error) {
    console.error("Error getting all TeamProfiles:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  createTeamProfile,
  updateTeamProfile,
  deleteTeamProfile,
  getAllTeamProfiles
};
