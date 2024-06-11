const express = require('express');
const { addVideo, getAllVideos, getVideoById, updateVideo, deleteVideo } = require('../controllers/videoController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const multer = require('multer');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({});
const upload = multer({ storage });

router.route('/')
  .get(getAllVideos)
  .post(isAuthenticatedUser, authorizeRoles('admin'), upload.single('video'), addVideo);

router.route('/:id')
  .get(getVideoById)
  .put(isAuthenticatedUser, authorizeRoles('admin'), upload.single('video'), updateVideo)
  .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteVideo);

module.exports = router;
