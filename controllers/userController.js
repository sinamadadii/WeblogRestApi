const jwt = require("jsonwebtoken");

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("../utils/mailer");

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
      res.status(200).json({ token, userId: user._id.toString() });
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
    const { name, email, password } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      const error = new Error("کاربری بااین ایمیل موجوده");
      error.statusCode = 422;
      throw error;
    } else {
      await User.create({ name, email, password });

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

    res.status(200).json({message:"ایمیل فرستاده شد"});
  } catch (error) {
    next(error);
  }
};

exports.handleResetPassword = async (req, res, next) => {
  const token = req.params.token;
  const { password, confirmPassword } = req.body;
  console.log(password, confirmPassword);
  const decodedToken=jwt.verify(token,process.env.JWT_SECRET)
  try {
    if (!decodedToken) {
      const error = new Error("توکن درست نیست");
      error.statusCode = 422;
      throw error;
    }
    if (password !== confirmPassword) {
      const error = new Error("کلمه های عبوریکسان نیست");
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findOne({ _id: decodedToken.userId });

    if (!user) {
      const error = new Error("کاربری موجودنیست");
      error.statusCode = 404;
      throw error;    }

    user.password = password;
    await user.save();
res.status(200).json({message:"حله"})
  } catch (error) {
    next(error)
  }
};
