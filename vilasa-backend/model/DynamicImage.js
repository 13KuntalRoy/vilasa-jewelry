const mongoose = require("mongoose");

const dynamicImageSchema = new mongoose.Schema({
  imageUrl: {
    public_id: String,
    url: String,
  },
  group: {
    type: String,
    required: true,
  },
  url: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Url",
  },
});

module.exports = mongoose.model("DynamicImage", dynamicImageSchema);
