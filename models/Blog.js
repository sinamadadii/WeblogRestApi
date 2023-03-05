const mongoose = require("mongoose");

const { schema } = require("./secure/postValidation");

const blogSchmea = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 100,
  },
  body: {
    type: String,
    required: true,
  },
  isAccept: {
    type: String,
    default: "waiting",
    enum: ["reject", "accept", "waiting"],
  },
  thumbnail: {
    type: Array,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  date: {
    type: Date,
  },
  durationTime: {
    type: Number,
    required: true,
    default: 0,
  },
  joinedUsers: {
    type: Array,
  },
  capacity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
  },
  type: {
    type: String,
    enum: ["forest", "sea", "offroad", "desert", "historical", "mountain"],
  },
  city: {
    type: String,
    default: "Tehran",
    enum: ["Tabriz", "Tehran", "Alborz"],
  },
  status: {
    type: String,
    default: "Recruiting",
    enum: ["Recruiting", "closed"],
  },
});

blogSchmea.index({ title: "text" });

blogSchmea.statics.postValidation = function (body) {
  return schema.validate(body, { abortEarly: false });
};

module.exports = mongoose.model("Blog", blogSchmea);
