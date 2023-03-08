const fs = require("fs");

const multer = require("multer");
const sharp = require("sharp");
const shortId = require("shortid");
const appRoot = require("app-root-path");
const User = require("../models/User");
const Gallery = require("../models/Gallery");
const Transactions = require("../models/Transactions");

const Blog = require("../models/Blog");
const { fileFilter } = require("../utils/multer");
const { getSinglePost } = require("./blogController");

exports.getMyPosts = async (req, res, next) => {
  try {
    const posts = await Blog.find({
      user: req.userId,
    }).sort({
      createdAt: "desc",
    });
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};
exports.getSinglePost = async (req, res, next) => {
  try {
    const post = await Blog.findOne({
      _id: req.params.id,
    });
    if (!post) {
      const error = new Error("چنین پستی نیست");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

exports.editPost = async (req, res, next) => {
  const thumbnails = req.files ? Object.values(req.files) : [];

  const post = await Blog.findOne({ _id: req.params.id });
  const thumbnailsnames = post.thumbnail;

  try {
    if (!post) {
      const error = new Error("چنین پستی نیست");
      error.statusCode = 404;
      throw error;
    }

    if (post.user.toString() != req.userId) {
      const error = new Error("شمامجوزویرایش اینو ندارید ");
      error.statusCode = 401;
      throw error;
    }
    await Blog.postValidation(req.body);

    await thumbnails.forEach((element) => {
      const fileName = `${shortId.generate()}_${element.name}`;
      const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`;
      thumbnailsnames.push(fileName);
      sharp(element.data)
        .jpeg({ quality: 60 })
        .toFile(uploadPath)
        .catch((err) => console.log(err));
    });

    const { title, isAccept, body, date, durationTime, capacity, type, price } =
      req.body;
    post.title = title;
    post.isAccept = "waiting";
    post.body = body;
    post.type = type;
    post.price = price;
    post.date = date;
    post.durationTime = durationTime;
    post.capacity = capacity;
    post.thumbnail = thumbnailsnames;
    await post.save();
    res.status(200).json({ message: "حله" });
  } catch (err) {
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post1 = await Blog.findById(req.params.id);
    if (post1.joinedUsers.lngth > 0) {
      const error = new Error("افرادعضوشده بیش از0 است نمیتوانید ");
      error.statusCode = 401;
      throw error;
    }
    const post = await Blog.findByIdAndDelete(req.params.id);
    post.thumbnail.forEach((item) => {
      const filePath = `${appRoot}/public/uploads/thumbnails/${item}`;
      fs.unlink(filePath, (err) => {
        if (err) {
          const error = new Error("خطای پاکسازی ");
          error.statusCode = 400;
          throw error;
        }
      });
    });

    const userssaved = await User.find({ saveds: { $in: [post] } });
    await userssaved.forEach(async (element) => {
      const saveds = await element.saveds;
      const index = await saveds.findIndex(
        (obj) => req.params.id === obj._id.toString()
      );
      await saveds.splice(index, 1);
      element.save();
    });

    res.status(200).json({ message: "حله" });
  } catch (err) {
    next();
  }
};

exports.uploadImage = (req, res, next) => {
  const upload = multer({
    limits: { fileSize: 4000000 },
    fileFilter: fileFilter,
  }).single("image");

  upload(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(422)
          .json({ error: "حجم عکس ارسالی نباید بیشتر از 4 مگابایت باشد" });
      }
      res.status(400).send({ error: err });
    } else {
      if (req.files) {
        const fileName = `${shortId.generate()}_${req.files.image.name}`;
        await sharp(req.files.image.data)
          .jpeg({
            quality: 60,
          })
          .toFile(`./public/uploads/${fileName}`)
          .catch((err) => console.log(err));
        res
          .status(200)
          .json({ image: `http://localhost:3000/uploads/${fileName}` });
      } else {
        res.status(400).json({ error: "عکس انتخاب کن" });
      }
    }
  });
};
exports.acceptPost = async (req, res, next) => {
  try {
    const post = await Blog.findById(req.body.id);
    const admin = await User.findById(req.userId);
    if (!post) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }
    if (admin.type !== "admin") {
      const error = new Error("شمامجوزندارید");
      error.statusCode = 401;
      throw error;
    }
    post.isAccept = req.body.data.toString();
    post.save();
    res.status(200).json({ message: "حله" });
  } catch (error) {
    next(error);
  }
};

exports.requestedTours = async (req, res, next) => {
  try {
    const users = await User.find({ isAccept: "waiting" }).sort({
      createdAt: "desc",
    });
    if (!users) {
      const error = new Error("هیچی نیس");
      error.statusCode = 404;
      throw error;
    }
    users.forEach((e) => {
      e.password = "";
    });
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};
exports.requestedPosts = async (req, res, next) => {
  try {
    const posts = await Blog.find({ isAccept: "waiting" }).sort({
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
exports.deletethumbnail = async (req, res, next) => {
  try {
    const post = await Blog.findById(req.body.id);
    if (req.userId.toString() !== post.user.toString()) {
      const error = new Error("شمادسترسی به این عمل راندارید ");
      error.statusCode = 403;
      throw error;
    }
    const thumbnails = await post.thumbnail;
    const index = thumbnails.findIndex((q) => q === req.body.name);
    await thumbnails.splice(index, 1);
    post.save();

    const filePath = `${appRoot}/public/uploads/thumbnails/${req.body.name}`;
    fs.unlink(filePath, (err) => {
      if (err) {
        const error = new Error("خطای پاکسازی ");
        error.statusCode = 400;
        throw error;
      } else {
        res.status(200).json({ message: "حله" });
      }
    });
  } catch (err) {
    next(err);
  }
};
exports.createPost = async (req, res, next) => {
  const thumbnails = req.files ? Object.values(req.files) : [];
  const thumbnailsnames = [];
  const permissions = Gallery.find({
    user: req.userId,
    type: "permissionphoto",
  });
  try {
    const numberOfpostsa = await Blog.find({
      isAccept: "accept",
      user: req.userId,
    }).countDocuments();
    const numberOfpostsw = await Blog.find({
      isAccept: "waiting",
      user: req.userId,
    }).countDocuments();
    const user = await User.findById(req.userId);
    if (permissions.length == 0) {
      const error = new Error("برای ایجادتوربایدقسمت مجوزهاتکمیل شود");
      error.statusCode = 404;
      throw error;
    }
    if (user.isAccept !== "accept") {
      const error = new Error("برای ایجادتورمجوزهابایدتاییدشود");
      error.statusCode = 404;
      throw error;
    }

    if (numberOfpostsw + numberOfpostsa == 5) {
      const error = new Error("شمانمی توانیدبیش از 5 تور ایجاد کنید");
      error.statusCode = 404;
      throw error;
    }
    req.body = { ...req.body, thumbnails };

    await Blog.postValidation(req.body);
    await thumbnails.forEach((element) => {
      const fileName = `${shortId.generate()}_${element.name}`;
      const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`;
      thumbnailsnames.push(fileName);
      sharp(element.data)
        .jpeg({ quality: 60 })
        .toFile(uploadPath)
        .catch((err) => console.log(err));
    });

    const post = await Blog.create({
      ...req.body,
      user: req.userId,
      thumbnail: thumbnailsnames,
      city: user.city,
    });
    res.status(200).json({ message: "حله", post: post });
  } catch (err) {
    next(err);
  }
};
exports.createGallery = async (req, res, next) => {
  const files = req.files ? Object.values(req.files) : [];
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }
    await files.forEach((element) => {
      const fileName = `${shortId.generate()}_${element.name}`;
      const uploadPath = `${appRoot}/public/uploads/gallery/${fileName}`;
      sharp(element.data)
        .jpeg({ quality: 60 })
        .toFile(uploadPath)
        .catch((err) => console.log(err));
      Gallery.create({
        user: req.userId,
        name: fileName,
        type: "galleryphoto",
      });
    });

    res.status(200).json({ message: "حله" });
  } catch (error) {
    next(error);
  }
};
exports.createTransactions = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }
    user.money = (await user.money) - req.body.price;
    user.save();
    await Transactions.create({
      user: user._id,
      createdAt: Date.now(),
      amount: req.body.price,
      paired: false,
    });

    res.status(200).json({ message: "حله" });
  } catch (error) {
    next(error);
  }
};

exports.setCampCity = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }
    user.city = req.body.city;
    user.save();
    res.status(200).json({ message: "حله" });
  } catch (err) {
    next();
  }
};
exports.deleteGallery = async (req, res, next) => {
  try {
    const gallery = await Gallery.findOneAndDelete(req.params.id);
    const filePath = `${appRoot}/public/uploads/gallery/${gallery.name}`;
    fs.unlink(filePath, (err) => {
      if (err) {
        const error = new Error("خطای پاکسازی ");
        error.statusCode = 400;
        throw error;
      } else {
        res.status(200).json({ message: "حله" });
      }
    });
  } catch (err) {
    next();
  }
};
exports.gallery = async (req, res, next) => {
  try {
    const gallery = await Gallery.find({
      user: req.userId,
      type: "permissionphoto",
    }).sort({
      createdAt: "desc",
    });
    res.status(200).json(gallery);
  } catch (err) {
    next(err);
  }
};
exports.joinTour = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }
    if (req.body.status !== "ok") {
      const error = new Error(
        "پرداخت باموفقیت انجام نشد وشمانتوانستید عضو بشید"
      );
      error.statusCode = 410;
      throw error;
    }

    const profilephotoss = await Gallery.find({
      user: req.userId,
      type: "profilephoto",
    }).sort({
      createdAt: "desc",
    });
    const { _id, name, email } = user;
    const profile = { _id, name, email, profilephotoss };
    const post = await Blog.findById(req.body.postId);
    const touruser = await User.findById(post.user);
    touruser.blockedmoney = (await touruser.blockedmoney) + post.price;

    await post.joinedUsers.push(profile);
    // await user.joinedTours.push(post);
    touruser.save();
    post.save();
    // user.save();
    res.status(200).json({ message: "حله" });
  } catch (err) {
    next(err);
  }
};
exports.unJoinTour = async (req, res, next) => {
  try {
    const post = await Blog.findById(req.body.postId);
    const joinedUsersTour = await post.joinedUsers;

    const index = joinedUsersTour.findIndex(
      (q) => q._id.toString() === req.userId
    );
    const touruser = await User.findById(post.user);
    touruser.money = (await touruser.money) - post.price;

    await joinedUsersTour.splice(index, 1);
    touruser.save();
    post.save();
    res.status(200).json({ message: "حله" });
  } catch (err) {
    next(err);
  }
};
exports.addPermissions = async (req, res, next) => {
  const files = req.files ? Object.values(req.files) : [];
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }
    await files.forEach((element) => {
      const fileName = `${shortId.generate()}_${element.name}`;
      const uploadPath = `${appRoot}/public/uploads/permissions/${fileName}`;
      sharp(element.data)
        .jpeg({ quality: 60 })
        .toFile(uploadPath)
        .catch((err) => console.log(err));
      Gallery.create({
        user: req.userId,
        name: fileName,
        type: "permissionphoto",
      });
    });
    user.save();
    res.status(200).json({ message: "حله" });
  } catch (error) {
    next(error);
  }
};
exports.permissions = async (req, res, next) => {
  try {
    const auser = await Gallery.find({
      user: req.userId,
      type: "permissionphoto",
    });
    res.status(200).json(auser);
  } catch (err) {
    next(err);
  }
};
exports.addSaveds = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }
    const post = await Blog.findById(req.body.postId);

    await user.saveds.push(post);
    user.save();
    res.status(200).json({ message: "حله" });
  } catch (error) {
    next(error);
  }
};
exports.unSaved = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }

    const savedposts = await user.saveds;
    const index = await savedposts.findIndex(
      (obj) => req.body.postId === obj._id.toString()
    );

    await savedposts.splice(index, 1);
    user.save();
    res.status(200).json({ message: "حله" });
  } catch (error) {
    next(error);
  }
};
exports.saveds = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }
    const savs = await user.saveds;

    res.status(200).json(savs);
  } catch (err) {
    next(err);
  }
};
exports.joineds = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const { _id, name, email, profilePhoto } = user;
    const profilephotoss = await Gallery.find({
      user: req.userId,
      type: "profilephoto",
    }).sort({
      createdAt: "desc",
    });
    const profile = { _id, name, email, profilephotoss };
    const toursjoined = await Blog.find({ joinedUsers: { $in: [profile] } });
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(toursjoined);
  } catch (err) {
    next(err);
  }
};
exports.isSaved = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const saveds = await user.saveds;
    let uuu = false;

    await saveds.forEach(async (element) => {
      if (element._id.toString() === (await req.body.postId)) {
        uuu = true;
      }
    });
    res.status(200).json(uuu);
  } catch (err) {
    next(err);
  }
};
exports.isJoined = async (req, res, next) => {
  try {
    const post = await Blog.findById(req.body.postId);
    if (!post) {
      const error = new Error("چنین پستی نیست");
      error.statusCode = 404;
      throw error;
    }
    const joinedz = await post.joinedUsers;
    let uuu = false;

    await joinedz.forEach(async (element) => {
      if (element._id.toString() === (await req.userId)) {
        uuu = true;
      }
    });
    res.status(200).json(uuu);
  } catch (err) {
    next(err);
  }
};
exports.searchuser = async (req, res, next) => {
  try {
    const regex = new RegExp(req.params.text);
    const users = await User.find({
      username: { $regex: regex },
      type: "tourist",
    });
    const usertour = await User.findById(req.userId);
    const gallery = await Gallery.find({
      type: "profilephoto",
    }).sort({
      createdAt: "desc",
    });
    if (usertour.isAccept !== "accept") {
      const error = new Error("مجوزهای شماهنوز تایید نشده است");
      error.statusCode = 405;
      throw error;
    }
    const users2 = [];
    await users.forEach(async (element) => {
      const obj = {
        id: "",
        profilePhotos: [],
        email: "",
        name: "",
        username: "",
      };
      const arr = [];

      await gallery.forEach((param) => {
        if (param.user.toString() === element._id.toString()) {
          arr.push(param);
        }
      });
      obj.id = element._id;
      obj.profilePhotos = arr;
      obj.email = element.email;
      obj.name = element.name;
      obj.username = element.username;

      users2.push(obj);
    });
    if (users2.length === 0) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 408;
      throw error;
    }
    res.status(200).json(users2);
  } catch (err) {
    next(err);
  }
};
exports.addleaders = async (req, res, next) => {
  try {
    const leader = await User.findById(req.body.id);
    if (!leader) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }
    const leaders = user.leaders;
    leaders.forEach((element) => {
      if (element._id.toString() === leader._id.toString()) {
        const error = new Error("شماقبلااین کاربررواضافه کردید");
        error.statusCode = 409;
        throw error;
      }
    });

    const profilephotoss = await Gallery.find({
      user: req.body.id,
      type: "profilephoto",
    }).sort({
      createdAt: "desc",
    });
    const { _id, name, email, username } = leader;
    const profile = { _id, name, email, username, profilephotoss };

    await user.leaders.push(profile);
    user.save();
    res.status(200).json({ message: "حله" });
  } catch (err) {
    next(err);
  }
};
exports.getLeaders = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("هیچی نیس");
      error.statusCode = 404;
      throw error;
    }
    let leaders = await user.leaders;

    res.status(200).json(leaders);
  } catch (err) {
    next(err);
  }
};
exports.deleteleader = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }

    const leaders = await user.leaders;
    const index = await leaders.findIndex(
      (obj) => req.body.id === obj._id.toString()
    );

    await leaders.splice(index, 1);
    user.save();
    res.status(200).json({ message: "حله" });
  } catch (error) {
    next(error);
  }
};
exports.alltransactionstoadmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }
    if (user.type !== "admin") {
      const error = new Error(" مجورندارید");
      error.statusCode = 404;
      throw error;
    }
    const transactions = await Transactions.find({ paired: false }).populate('user');

    res.status(200).json(transactions);
  } catch (error) {
    next(error);
  }
};
exports.setpairtransaction = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }
    if (user.type !== "admin") {
      const error = new Error(" مجورندارید");
      error.statusCode = 404;
      throw error;
    }
    const transaction = await Transactions.findById(req.body.id);
    transaction.paired = await req.body.data.toString();
    await transaction.save();

    res.status(200).json({message:'حله'});
  } catch (error) {
    next(error);
  }
};
exports.incomeTour = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }
    const posts = await Blog.find({
      isAccept: "accept",
      user: user._id,
    }).sort({
      createdAt: "desc",
    });
    if (!posts) {
      const error = new Error("هیچی نیس");
      error.statusCode = 404;
      throw error;
    }

    await posts.forEach(async (element) => {
      let now = new Date();
      let date = element.date;
      let tourentireprice = element.price * element.joinedUsers.length;
      if (now > date) {
        if (!element.pairtotour) {
          user.money = user.money + tourentireprice;
          user.blockedmoney = user.blockedmoney - tourentireprice;
          element.pairtotour = true;
          element.save();
          user.save();
        }
      }
    });
    const trans = await Transactions.find({ user: user._id });

    res.status(200).json({
      blokedmony: user.blockedmoney,
      money: user.money,
      transactions: trans,
    });
  } catch (error) {
    next(error);
  }
};
