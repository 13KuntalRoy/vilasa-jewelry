const DynamicImage = require("../model/DynamicImage");
const cloudinary = require("cloudinary").v2;

// @desc    Upload dynamic image
// @route   POST /api/dynamic-images/upload
// @access  Admin
exports.uploadDynamicImage = async (req, res, next) => {
  try {
    // Check if files were uploaded
    if (!req.body.image) {
      return res.status(400).json({ success: false, message: "No files were uploaded." });
    }

    // Specify the folder where you want to upload the image in Cloudinary
    const folder = 'dynamic-images'; // Change this to your desired folder name

    // Upload image to Cloudinary with specified folder
    const result = await cloudinary.uploader.upload(req.body.image, { folder });

    // Save image URL and group to the database
    const dynamicImage = await DynamicImage.create({
      imageUrl: {
        public_id: result.public_id,
        url: result.secure_url
      },
      group: req.body.group // Assuming group is sent in the request body
    });

    // Respond with success and the created dynamic image
    res.status(201).json({
      success: true,
      data: dynamicImage,
    });
  } catch (error) {
    next(error); // Pass any error to the error handler middleware
  }
};

// @desc    Get all dynamic images
// @route   GET /api/dynamic-images
// @access  Public
exports.getDynamicImages = async (req, res, next) => {
  try {
    const dynamicImages = await DynamicImage.find();
    res.status(200).json({
      success: true,
      count: dynamicImages.length,
      data: dynamicImages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single dynamic image
// @route   GET /api/dynamic-images/:id
// @access  Public
exports.getDynamicImage = async (req, res, next) => {
  try {
    const dynamicImage = await DynamicImage.findById(req.params.id);
    if (!dynamicImage) {
      return res.status(404).json({
        success: false,
        error: "Dynamic image not found",
      });
    }
    res.status(200).json({
      success: true,
      data: dynamicImage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update dynamic image
// @route   PUT /api/dynamic-images/:id
// @access  Admin
exports.updateDynamicImage = async (req, res, next) => {
  try {
    let dynamicImage = await DynamicImage.findById(req.params.id);

    if (!dynamicImage) {
      return res.status(404).json({
        success: false,
        error: "Dynamic image not found",
      });
    }

    // Check if there is a file to upload
    if (req.body.image) {
      const file = req.body.image;

      // Delete existing image from Cloudinary
      await cloudinary.uploader.destroy(dynamicImage.imageUrl.public_id);

      // Upload new image to Cloudinary with a specified folder
      const result = await cloudinary.uploader.upload(file, { folder: 'dynamic-images' });

      // Update database record with new image URL and public_id
      dynamicImage.imageUrl = {
        public_id: result.public_id,
        url: result.secure_url
      };

      // Save the updated dynamic image record
      await dynamicImage.save();

      res.status(200).json({
        success: true,
        data: dynamicImage,
      });
    } else {
      // Update other fields if provided in the request body
      for (const key in req.body) {
        if (req.body.hasOwnProperty(key)) {
          dynamicImage[key] = req.body[key];
        }
      }

      // Save the updated dynamic image record
      dynamicImage = await dynamicImage.save();

      res.status(200).json({
        success: true,
        data: dynamicImage,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get dynamic images by group
// @route   GET /api/dynamic-images/group/:group
// @access  Public
exports.getDynamicImagesByGroup = async (req, res, next) => {
  try {
    const { group } = req.params;
    const dynamicImages = await DynamicImage.find({ group });

    if (!dynamicImages || dynamicImages.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Dynamic images not found for the specified group",
      });
    }

    res.status(200).json({
      success: true,
      count: dynamicImages.length,
      data: dynamicImages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete dynamic image
// @route   DELETE /api/dynamic-images/:id
// @access  Admin
exports.deleteDynamicImage = async (req, res, next) => {
  try {
    const dynamicImage = await DynamicImage.findById(req.params.id);

    if (!dynamicImage) {
      return res.status(404).json({
        success: false,
        error: "Dynamic image not found",
      });
    }

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(dynamicImage.imageUrl.public_id);

    // Remove dynamic image from the database
    await dynamicImage.remove();

    res.status(200).json({
      success: true,
      message: "Dynamic image deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
