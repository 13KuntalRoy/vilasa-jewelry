const express = require('express');
const router = express.Router();
const {
  createTeamProfile,
  updateTeamProfile,
  deleteTeamProfile,
  getAllTeamProfiles
} = require('../controllers/teamprofileController');

router.route('/teamProfiles')
  // Create a new TeamProfile
  .post(async (req, res) => {
    await createTeamProfile(req, res);
  })
  // Get all TeamProfiles
  .get(async (req, res) => {
    await getAllTeamProfiles(req, res);
  });

router.route('/teamProfiles/:id')
  // Update a TeamProfile
  .put(async (req, res) => {
    await updateTeamProfile(req, res);
  })
  // Delete a TeamProfile
  .delete(async (req, res) => {
    await deleteTeamProfile(req, res);
  });

module.exports = router;
