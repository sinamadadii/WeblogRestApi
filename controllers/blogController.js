const Yup = require("yup");
const captchapng = require("captchapng");
const Blog = require("../models/Blog");
const { sendEmail } = require("../utils/mailer");
const User = require("../models/User");
const Gallery = require("../models/Gallery");


let CAPTCHA_NUM;

exports.getIndex = async (req, res, next) => {
  try {
    const numberOfPosts = await Blog.find({
      isAccept: "accept",
    }).countDocuments();

    const posts = await Blog.find({ isAccept: "accept" }).sort({
      createdAt: "desc",
    });
    if (!posts) {
      const error = new Error("هیچی نیس");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ posts, total: numberOfPosts });
  } catch (err) {
    next(err);
  }
};

exports.getCampTours = async (req, res, next) => {
  try {
    const posts = await Blog.find({
      isAccept: "accept",
      user: req.params.id,
    }).sort({
      createdAt: "desc",
    });
    if (!posts) {
      const error = new Error("هیچی نیس");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};
exports.getCampGallery = async (req, res, next) => {
  try {
    const posts = await Gallery.find({
      user: req.params.id,
    }).sort({
      createdAt: "desc",
    });
    if (!posts) {
      const error = new Error("هیچی نیس");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};
exports.getPopularCamps = async (req, res, next) => {
  try {
    const camps = await User.find({ type: "tour" });
    if (!camps) {
      const error = new Error("هیچی نیس");
      error.statusCode = 404;
      throw error;
    }
    const popCamps = [];
    camps.forEach((element) => {
      const obj = { id: "", photo: "" };
      obj.id = element._id;
      obj.photo = element.profilePhoto;
      popCamps.push(obj);
    });

    res.status(200).json(popCamps);
  } catch (err) {
    next(err);
  }
};

exports.getPopularTours = async (req, res, next) => {
  try {
    const tours = await Blog.find({ isAccept: "accept" });
    if (!tours) {
      const error = new Error("هیچی نیس");
      error.statusCode = 404;
      throw error;
    }
    
    res.status(200).json(tours);
  } catch (err) {
    next(err);
  }
};
exports.getSinglePost = async (req, res, next) => {
  try {
    const post = await Blog.findOne({ _id: req.params.id }).populate("user");

    if (!post) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ post });
  } catch (err) {
    next(err);
  }
};
exports.getSingleuser = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id });

    if (!user) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      name: user.name,
      photo: user.profilePhoto,
    });
  } catch (err) {
    next(err);
  }
};

exports.handleContactPage = async (req, res, next) => {
  const errorArr = [];

  const { name, email, message } = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required("نام و نام خانوادگی الزامی می باشد"),
    email: Yup.string()
      .email("آدرس ایمیل صحیح نیست")
      .required("آدرس ایمیل الزامی می باشد"),
    message: Yup.string().required("پیام اصلی الزامی می باشد"),
  });

  try {
    await schema.validate(req.body, { abortEarly: false });

    sendEmail(
      email,
      name,
      "پیام از طرف وبلاگ",
      `${message} <br/> ایمیل کاربر : ${email}`
    );

    res.status(200).json({ message: "پیام موفق شد" });
  } catch (err) {
    next(err);
  }
};

exports.getCaptcha = (req, res) => {
  CAPTCHA_NUM = parseInt(Math.random() * 9000 + 1000);
  const p = new captchapng(80, 30, CAPTCHA_NUM);
  p.color(0, 0, 0, 0);
  p.color(80, 80, 80, 255);

  const img = p.getBase64();
  const imgBase64 = Buffer.from(img, "base64");

  res.send(imgBase64);
};
