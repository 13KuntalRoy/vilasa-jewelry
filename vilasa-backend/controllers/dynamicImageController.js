const DynamicImage = require("../model/DynamicImage");
const cloudinary = require("cloudinary").v2;
const asyncErrorHandler = require('../middleware/asyncErrorHandler');

// @desc    Upload dynamic image
// @route   POST /api/dynamic-images/upload
// @access  Admin
exports.uploadDynamicImage = asyncErrorHandler(async (req, res, next) => {
  // Check if files were uploaded
  if (!req.files || !req.files.image) {
    return res.status(400).json({ success: false, message: "No image file was uploaded." });
  }

  // Specify the folder where you want to upload the image in Cloudinary
  const folder = 'dynamic-images'; // Change this to your desired folder name

  // Upload image to Cloudinary with specified folder
  const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, { folder });

  // Save image URL and group to the database
  const dynamicImage = await DynamicImage.create({
    imageUrl: {
      public_id: result.public_id,
      url: result.secure_url
    },
    group: req.body.group, // Assuming group is sent in the request body
    url: req.body.url
  });

  // Respond with success and the created dynamic image
  res.status(201).json({
    success: true,
    data: dynamicImage,
  });
});

// @desc    Get all dynamic images
// @route   GET /api/dynamic-images
// @access  Public
exports.getDynamicImages = asyncErrorHandler(async (req, res, next) => {
  const dynamicImages = await DynamicImage.find();
  res.status(200).json({
    success: true,
    count: dynamicImages.length,
    data: dynamicImages,
  });
});

// @desc    Get single dynamic image
// @route   GET /api/dynamic-images/:id
// @access  Public
exports.getDynamicImage = asyncErrorHandler(async (req, res, next) => {
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
});

// @desc    Update dynamic image
// @route   PUT /api/dynamic-images/:id
// @access  Admin
exports.updateDynamicImage = asyncErrorHandler(async (req, res, next) => {
  let dynamicImage = await DynamicImage.findById(req.params.id);

  if (!dynamicImage) {
    return res.status(404).json({
      success: false,
      error: "Dynamic image not found",
    });
  }

  // Check if there is a file to upload
  if (req.files && req.files.image) {
    const file = req.files.image;

    // Delete existing image from Cloudinary
    await cloudinary.uploader.destroy(dynamicImage.imageUrl.public_id);

    // Upload new image to Cloudinary with a specified folder
    const result = await cloudinary.uploader.upload(file.tempFilePath, { folder: 'dynamic-images' });

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
});

// @desc    Get dynamic images by group
// @route   GET /api/dynamic-images/group/:group
// @access  Public
exports.getDynamicImagesByGroup = asyncErrorHandler(async (req, res, next) => {
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
});

// @desc    Delete dynamic image
// @route   DELETE /api/dynamic-images/:id
// @access  Admin
exports.deleteDynamicImage = asyncErrorHandler(async (req, res, next) => {
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
});
