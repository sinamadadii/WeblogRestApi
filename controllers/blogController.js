const Yup = require("yup");
const captchapng = require("captchapng");
const Blog = require("../models/Blog");
const { sendEmail } = require("../utils/mailer");
const User = require("../models/User");
const Gallery = require("../models/Gallery");
const jwt = require("jsonwebtoken");

let CAPTCHA_NUM;

exports.getIndex = async (req, res, next) => {
  try {
    const posts = await Blog.find({
      isAccept: "accept",
      city: req.params.city,
    }).sort({
      createdAt: "desc",
    });
    if (posts.length === 0) {
      const error = new Error("هیچی نیس");
      error.statusCode = 408;
      throw error;
    }

    res.status(200).json({ posts });
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
exports.getCampLeaders = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      const error = new Error("هیچی نیس");
      error.statusCode = 404;
      throw error;
    }
    const leaders = await user.leaders;

    res.status(200).json(leaders);
  } catch (err) {
    next(err);
  }
};
exports.getCampGallery = async (req, res, next) => {
  try {
    const posts = await Gallery.find({
      user: req.params.id,
      type: "permissionphoto",
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
exports.getRelatedTours = async (req, res, next) => {
  try {
    const posts = await Blog.find({
      type: req.body.typep,
      _id: { $ne: req.body.id },
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
    const camps = await User.find({ type: "tour", city: req.params.city })
      .sort({
        rate: -1,
      })
      .limit(5);

    const profilePhotos = await Gallery.find({
      type: "profilephoto",
    }).sort({
      createdAt: "desc",
    });
    const popCamps = [];
    await camps.forEach(async (element) => {
      const obj = {
        id: "",
        rate: 0,
        profilePhotos: [],
        description: "",
        name: "",
      };
      const arr = [];

      await profilePhotos.forEach((param) => {
        if (param.user.toString() === element._id.toString()) {
          arr.push(param);
        }
      });
      obj.id = element._id;
      obj.profilePhotos = arr;
      obj.rate = element.rate;
      obj.description = element.description;
      obj.name = element.name;
      obj.leaders = element.leaders;

      popCamps.push(obj);
    });
    if (popCamps.length === 0) {
      const error = new Error("هیچی نیس");
      error.statusCode = 408;
      throw error;
    }
    res.status(200).json(popCamps);
  } catch (err) {
    next(err);
  }
};

exports.getPopularTours = async (req, res, next) => {
  try {
    const tours = await Blog.find({ isAccept: "accept", city: req.params.city })
      .sort({
        capacity: 1,
      })
      .limit(5);
    if (tours.length === 0) {
      const error = new Error("هیچی نیس");
      error.statusCode = 408;
      throw error;
    }

    res.status(200).json(tours);
  } catch (err) {
    next(err);
  }
};
exports.getSinglePost = async (req, res, next) => {
  try {
    const post = await Blog.findById(req.params.id);
    const user = await User.findById(post.user);

    if (!post) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }
    const obj = {
      _id: post._id,
      date: post.date,
      body: post.body,
      capacity: post.capacity,
      createdAt: post.createdAt,
      durationTime: post.durationTime,
      isAccept: post.isAccept,
      title: post.title,
      type: post.type,
      thumbnail: post.thumbnail,
      joinedUsers: post.joinedUsers,
      price: post.price,
    };
    res
      .status(200)
      .json({ post: obj, user: { id: user._id, name: user.name } });
  } catch (err) {
    next(err);
  }
};
exports.getpostjoiners = async (req, res, next) => {
  try {
    const post = await Blog.findById(req.params.id);

    if (!post) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json(post.joinedUsers);
  } catch (err) {
    next(err);
  }
};
exports.getSingleuser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    const profilePhotos = await Gallery.find({
      user: req.params.id,
      type: "profilephoto",
    }).sort({
      createdAt: "desc",
    });
    if (!user) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      name: user.name,
      profilePhotos: profilePhotos,
      description: user.description,
      rate: user.rate,
      id: user._id,
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

exports.searchTour = async (req, res, next) => {
  try {
    const posts = await Blog.filter((arrBirds) => arrBirds.includes("ov"));

    if (!posts) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(posts);
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
