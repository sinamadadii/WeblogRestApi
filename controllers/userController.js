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
    res.status(200).json(true);
  } catch (error) {
    next(error);
  }
};
exports.handleLogin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ email: email }, { username: email }],
    });
    if (!user) {
      const error = new Error("کاربری یافت نشد");
      error.statusCode = 404;
      throw error;
    }
    const profilePhotos = await Gallery.find({ user: user._id,type:'profilephoto' }).sort({
      createdAt: "desc",
    });
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
          type: "admin",
        });
      }
      if (user.type == "tour") {
        res.status(206).json({
          token,
          profilePhotos,
          city: user.city,
          isAccept: user.isAccept,
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
    const { name, email, password, type, city } = req.body;
    const user = await User.findOne({ email });
    let isAccept = "accept";

    if (type == "tour") {
      isAccept = "waiting";
    }
    if (user) {
      const error = new Error("کاربری بااین ایمیل موجوده");
      error.statusCode = 422;
      throw error;
    } else {
      await User.create({ name, email, password, type, isAccept, city });

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
  const { email } = await req.body;
  try {
    const user = await User.findOne({
      $or: [{ email: email }, { username: email }],
    });
    if (!user) {
      const error = new Error("چنین کاربری موجود نیست");
      error.statusCode = 404;
      throw error;
    }
    const rnumb = Math.floor(Math.random() * (99999 - 10000)) + 10000;
    user.rnumb = rnumb;
    await user.save();
    console.log(rnumb);
    // sendEmail(
    //   user.email,
    //   user.name,
    //   "فراموشی رمز عبور",
    //   `
    //     جهت تغییر رمز عبور فعلی رو لینک زیر کلیک کنید
    //     <a href="${resetLink}">لینک تغییر رمز عبور</a>
    // `
    // );

    res.status(200).json({ message: "ایمیل فرستاده شد", userId: user._id });
  } catch (error) {
    next(error);
  }
};
exports.handleForgetPasswordResieved = async (req, res, next) => {
  const { id, rnumb } = await req.body;

  try {
    const user = await User.findById(id);

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
    if (!user) {
      const error = new Error("چنین کاربری موجود نیست");
      error.statusCode = 404;
      throw error;
    }

    if (Number(rnumb) !== user.rnumb) {
      const error = new Error("کدواردشده اشتباه است");
      error.statusCode = 403;
      throw error;
    }

    res.status(200).json({ token });
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
exports.handleChangePassword = async (req, res, next) => {
  const user = await User.findById(req.userId);

  const { oldPassword, newPassword, confirmPassword } = await req.body;
  const isEqual = await bcrypt.compare(oldPassword, user.password);

  try {
    if (!newPassword) {
      const error = new Error("کلمه عبور نباید کمتر از 4 کاراکتر باشد");
      error.statusCode = 401;
      throw error;
    }
    if (newPassword.length < 4) {
      const error = new Error("کلمه عبور نباید کمتر از 4 کاراکتر باشد");
      error.statusCode = 401;
      throw error;
    }
    if (!isEqual) {
      const error = new Error("کلمه عبورنادرست است");
      error.statusCode = 401;
      throw error;
    }
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
    const { username, name, description, email, phoneNumber } = req.body;

    let usernam = null;
    if (user.type === "tourist") {
      usernam = await User.findOne({ username: username.toLowerCase() });
    }
    const usernamemail = await User.findOne({ email: email });
    if (usernamemail) {
      if (usernamemail._id.toString() !== req.userId) {
        const error = new Error("چنین  ایمیلی موجود است");
        error.statusCode = 406;
        throw error;
      }
    }
    if (usernam) {
      if (usernam._id.toString() !== req.userId) {
        const error = new Error("چنین نام کاربری موجود است");
        error.statusCode = 406;
        throw error;
      }
    }

    user.name = name;
    user.username = username?.toLowerCase();
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
    const profilePhotos = await Gallery.find({ user: req.userId,type:'profilephoto' }).sort({
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
      username: user.username,
      profilePhotos: profilePhotos,
      description: user.description,
      city: user.city,
      money: user.money,
      isAccept: user.isAccept,
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
    files.forEach(async (element) => {
      const fileName = `${shortId.generate()}_${await element.name}`;
      const uploadPath = `${appRoot}/public/uploads/profilePhotos/${fileName}`;
      sharp(await element.data)
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
