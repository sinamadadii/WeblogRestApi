const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");

const { fileFilter } = require("../utils/multer");
const sharp = require("sharp");
const shortId = require("shortid");
const appRoot = require("app-root-path");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("../utils/mailer");
const Gallery = require("../models/Gallery");

exports.isAuth = (req, res, next) => {
  const authHeader = req.get("Authorization");
  try {
    if (!authHeader) {
      const error = new Error("مجوزندارین");
      error.statusCode = 401;
      throw error;
    }
    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      const error = new Error("مجوزندارین");
      error.statusCode = 401;
      throw error;
    }
    // req.userId=decodedToken.user.userId
    res.status(200).json(true);
  } catch (error) {
    next(error);
  }
};
exports.handleLogin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("کاربری یافت نشد");
      error.statusCode = 404;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (isEqual) {
      const token = jwt.sign(
        {
          user: {
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
          },
        },
        process.env.JWT_SECRET
        // {
        //   expiresIn: "1h",
        // }
      );
      if (user.type == "admin") {
        res.status(200).json({
          token,
          userId: user._id.toString(),
          userEmail: user.email,
          name: user.name,
          type: "admin",
        });
      }
      if (user.type == "tour") {
        res.status(206).json({
          token,
          userId: user._id.toString(),
          userEmail: user.email,
          name: user.name,
          type: "tour",
          profilePhoto: user.profilePhoto,
          description: user.description,
          rate: user.rate,
          isAccept: user.isAccept,
          phoneNumber: user.phoneNumber,
          money: user.money,
        });
      }
      if (user.type == "tourist") {
        res.status(207).json({
          token,
          userId: user._id.toString(),
          userEmail: user.email,
          name: user.name,
          type: "tourist",
          profilePhoto: user.profilePhoto,
          description: user.description,
          rate: user.rate,
          phoneNumber: user.phoneNumber,
        });
      }
    } else {
      const error = new Error("کلمه عبوریارمز اشتباهه");
      error.statusCode = 422;
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    await User.userValidation(req.body);
    const { name, email, password, type } = req.body;
    const user = await User.findOne({ email });
    let isAccept = "accept";
    // let type = "admin"

    if (type == "tour") {
      isAccept = "waiting";
    }
    if (user) {
      const error = new Error("کاربری بااین ایمیل موجوده");
      error.statusCode = 422;
      throw error;
    } else {
      await User.create({ name, email, password, type, isAccept });

      //? Send Welcome Email
      // sendEmail(
      //   email,
      //   name,
      //   "خوش آمدی به وبلاگ ما",
      //   "خیلی خوشحالیم که به جمع ما وبلاگرهای خفن ملحق شدی"
      // );
      res.status(201).json({ message: "عضوشد" });
    }
  } catch (err) {
    next(err);
  }
};
exports.handleForgetPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      const error = new Error("چنین ایمیلی موجود نیست");
      error.statusCode = 404;
      throw error;
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const resetLink = `http://localhost:3000/users/reset-password/${token}`;

    // sendEmail(
    //   user.email,
    //   user.name,
    //   "فراموشی رمز عبور",
    //   `
    //     جهت تغییر رمز عبور فعلی رو لینک زیر کلیک کنید
    //     <a href="${resetLink}">لینک تغییر رمز عبور</a>
    // `
    // );

    res.status(200).json({ message: "ایمیل فرستاده شد" });
  } catch (error) {
    next(error);
  }
};

exports.handleResetPassword = async (req, res, next) => {
  const authHeader = req.get("Authorization");
  const token = authHeader.split(" ")[1];

  const { newPassword, confirmPassword } = req.body;
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  try {
    if (!decodedToken) {
      const error = new Error("توکن درست نیست");
      error.statusCode = 422;
      throw error;
    }
    const user = await User.findOne({ _id: decodedToken.user.userId });

    if (newPassword !== confirmPassword) {
      const error = new Error("کلمه های عبوریکسان نیست");
      error.statusCode = 401;
      throw error;
    }

    if (!user) {
      const error = new Error("کاربری موجودنیست");
      error.statusCode = 404;
      throw error;
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: "حله" });
  } catch (error) {
    next(error);
  }
};
exports.acceptTour = async (req, res, next) => {
  try {
    const user = await User.findById(req.body.id);
    if (!user) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }
    // if (user.role !== process.env.ADMINROLE) {
    //   const error = new Error("شمامجوزویرایش اینو ندارید ");
    //   error.statusCode = 401;
    //   throw error;
    // }
    user.isAccept = req.body.data.toString();
    user.save();
    res.status(200).json({ message: "حله" });
  } catch (error) {
    next(error);
  }
};
exports.editProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }
    const {
      profilePhotos,
      profilePhoto,
      name,
      description,
      email,
      phoneNumber,
    } = req.body;
    user.profilePhotos = profilePhotos;
    user.profilePhoto = profilePhoto;

    user.name = name;
    user.description = description;
    user.email = email;
    user.phoneNumber = phoneNumber;

    await user.save();
    res.status(200).json({
      message: "ویرایش باموفقیت انجام شد",
    });
  } catch (err) {
    next(err);
  }
};
exports.userProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const profilePhotos = await Gallery.find({ user: req.userId }).sort({
      createdAt: "desc",
    });
    if (!user) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      type: user.type,
      profilePhotos: profilePhotos,
      description: user.description,
    });
  } catch (err) {
    next(err);
  }
};
exports.uploadProfilePhoto = async (req, res, next) => {
  const files = req.files ? Object.values(req.files) : [];
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }
    if (!files) {
      const error = new Error("فایلی نیست");
      error.statusCode = 404;
      throw error;
    }
    files.forEach((element) => {
      const fileName = `${shortId.generate()}_${element.name}`;
      const uploadPath = `${appRoot}/public/uploads/profilePhotos/${fileName}`;
      sharp(element.data)
        .jpeg({ quality: 60 })
        .toFile(uploadPath)
        .catch((err) => console.log(err));
      Gallery.create({
        user: req.userId,
        name: fileName,
        type: "profilephoto",
      });
    });

    res.status(200).json({ message: "حله" });
  } catch (error) {
    next(error);
  }
};
exports.deleteProfile = async (req, res, next) => {
  const photo = await Gallery.findOne({
    user: req.userId,
    name: req.params.name,
  });
  try {
    await Gallery.findOneAndDelete({ user: req.userId, name: req.params.name });
    const filePath = `${appRoot}/public/uploads/profilePhotos/${photo.name}`;
    fs.unlink(filePath, (err) => {
      if (err) {
        const error = new Error("خطای پاکسازی ");
        error.statusCode = 400;
        throw error;
      }
    });
    res.status(200).json({ message: "حله" });
  } catch (err) {
    next();
  }
};
