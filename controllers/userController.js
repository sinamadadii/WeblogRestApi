const jwt = require("jsonwebtoken");

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("../utils/mailer");

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
    res.status(200).json();
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
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );
      if (user.type == "admin") {
        res
          .status(200)
          .json({
            token,
            userId: user._id.toString(),
            userEmail: user.email,
            name: user.name,
            type: "admin",
          });
      }
      if (user.type == "tour") {
        res
          .status(206)
          .json({
            token,
            userId: user._id.toString(),
            userEmail: user.email,
            name: user.name,
            type: "tour",
            profilePhoto: user.profilePhoto,
            description: user.description,
            rate:user.rate
          });
      }
      if (user.type == "tourist") {
        res
          .status(207)
          .json({
            token,
            userId: user._id.toString(),
            userEmail: user.email,
            name: user.name,
            type: "tourist",
            profilePhoto: user.profilePhoto,
            description: user.description,
            rate:user.rate
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

    if (user) {
      const error = new Error("کاربری بااین ایمیل موجوده");
      error.statusCode = 422;
      throw error;
    } else {
      await User.create({ name, email, password, type });

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
  const token = req.params.token;
  const { newPassword, confirmPassword ,oldPassword} = req.body;
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  try {
    

    if (!decodedToken) {
      const error = new Error("توکن درست نیست");
      error.statusCode = 422;
      throw error;
    }
    const user = await User.findOne({ _id: decodedToken.userId });
    const isEqual = await bcrypt.compare(oldPassword, decodedToken.password);

    if (!isEqual) {
      const error = new Error("رمزنادرست است");
      error.statusCode = 422;
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
