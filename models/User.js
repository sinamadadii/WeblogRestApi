const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { schema } = require("./secure/userValidation");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    // required: [true, "نام و نام خانوادگی الزامی می باشد"],
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    // required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 255,
  },
  phoneNumber: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["tourist", "tour", "admin"],
    required: true,
  },

  description: {
    type: String,
    default: "",
  },
  rate: {
    type: Number,
    default: 0,
  },
  tours: {
    type: Array,
  },
  isAccept: {
    type: String,
    default: "accept",
    enum: ["accept", "waiting", "reject"],
  },
 
  money: {
    type: Number,
    default: 0,
  },
  saveds: {
    type: Array,
  },
  leaders: {
    type: Array,
  },
  city: {
    type: String,
    default: "Tehran",
    enum: ["Tabriz", "Tehran", "Alborz"],
  },
  rnumb:{
    type:Number,
    default: 0,

  }
});

userSchema.statics.userValidation = function (body) {
  return schema.validate(body, { abortEarly: false });
};

userSchema.pre("save", function (next) {
  let user = this;

  if (!user.isModified("password")) return next();

  bcrypt.hash(user.password, 10, (err, hash) => {
    if (err) return next(err);

    user.password = hash;
    next();
  });
});

module.exports = mongoose.model("User", userSchema);
