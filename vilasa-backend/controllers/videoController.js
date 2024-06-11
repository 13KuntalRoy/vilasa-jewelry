const Video = require('../model/videoModel');
const cloudinary = require('cloudinary');


// Add a new video
exports.addVideo = async (req, res) => {
  try {
    const { title, description, productId } = req.body;
    const user = req.user.id;

    const result = await cloudinary.v2.uploader.upload(req.file.path, { resource_type: "video" });

    const video = new Video({
      title,
      description,
      video: {
        public_id: result.public_id,
        url: result.secure_url
      },
      product: productId,
      user
    });

    await video.save();

    res.status(201).json({
      success: true,
      video
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all videos
exports.getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find().populate('product user', 'name');
    res.status(200).json({
      success: true,
      videos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single video by ID
exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate('product user', 'name');
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    res.status(200).json({
      success: true,
      video
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update a video
exports.updateVideo = async (req, res) => {
  try {
    const { title, description, productId } = req.body;
    let video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    if (req.file) {
      await cloudinary.v2.uploader.destroy(video.video.public_id, { resource_type: "video" });
      const result = await cloudinary.v2.uploader.upload(req.file.path, { resource_type: "video" });
      video.video.public_id = result.public_id;
      video.video.url = result.secure_url;
    }

    video.title = title || video.title;
    video.description = description || video.description;
    video.product = productId || video.product;

    await video.save();

    res.status(200).json({
      success: true,
      video
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a video
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    await cloudinary.v2.uploader.destroy(video.video.public_id, { resource_type: "video" });
    await video.remove();

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
