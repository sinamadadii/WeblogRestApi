const mongoose = require("mongoose");

const gallerySchmea = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  type:{
    type:String,
    enum: ["profilephoto", "galleryphoto","permissionphoto"],
    required:true,
  }
});

module.exports = mongoose.model("Gallery", gallerySchmea);
