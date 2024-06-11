const express = require('express');
const { addVideo, getAllVideos, getVideoById, updateVideo, deleteVideo } = require('../controllers/videoController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');


const router = express.Router();


router.route('/')
  .get(getAllVideos)
  .post(isAuthenticatedUser, authorizeRoles('admin'), addVideo);

router.route('/:id')
  .get(getVideoById)
  .put(isAuthenticatedUser, authorizeRoles('admin'),updateVideo)
  .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteVideo);

module.exports = router;
