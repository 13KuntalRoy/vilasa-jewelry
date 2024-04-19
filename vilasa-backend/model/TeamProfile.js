const mongoose = require('mongoose');

const teamProfileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  avatar: {
    public_id: String,
    url: String,
  }
});

const TeamProfile = mongoose.model('TeamProfile', teamProfileSchema);

module.exports = TeamProfile;
