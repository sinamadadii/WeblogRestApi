const fs = require("fs");

const multer = require("multer");
const sharp = require("sharp");
const shortId = require("shortid");
const appRoot = require("app-root-path");
const User = require("../models/User");
const Gallery = require("../models/Gallery");

const Blog = require("../models/Blog");
const { fileFilter } = require("../utils/multer");

exports.getMyPosts = async (req, res, next) => {
  try {
    const posts = await Blog.find({
      user: req.params.id,
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
  const thumbnail = req.files ? req.files.thumbnail : {};
  const fileName = `${shortId.generate()}_${thumbnail.name}`;
  const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`;

  const post = await Blog.findOne({ _id: req.params.id });
  try {
    if (thumbnail.name) await Blog.postValidation({ ...req.body, thumbnail });
    else
      await Blog.postValidation({
        ...req.body,
        thumbnail: {
          name: "placeholder",
          size: 0,
          mimetype: "image/jpeg",
        },
      });

    if (!post) {
      const error = new Error("چنین پستی نیست");
      error.statusCode = 404;
      throw error;
    }

    if (post.user.toString() != req.userId) {
      const error = new Error("شمامجوزویرایش اینو ندارید ");
      error.statusCode = 401;
      throw error;
    } else {
      if (thumbnail.name) {
        fs.unlink(
          `${appRoot}/public/uploads/thumbnails/${post.thumbnail}`,
          async (err) => {
            if (err) console.log(err);
            else {
              await sharp(thumbnail.data)
                .jpeg({ quality: 60 })
                .toFile(uploadPath)
                .catch((err) => console.log(err));
            }
          }
        );
      }

      const { title, isAccept, body } = req.body;
      post.title = title;
      post.isAccept = isAccept;
      post.body = body;
      post.thumbnail = thumbnail.name ? fileName : post.thumbnail;

      await post.save();
      res.status(200).json({ message: "حله" });
    }
  } catch (err) {
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Blog.findOneAndDelete(req.params.id);
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
    if (!post) {
      const error = new Error("هیجی نیس");
      error.statusCode = 404;
      throw error;
    }
    // if (user.role !== process.env.ADMINROLE) {
    //   const error = new Error("شمامجوزویرایش اینو ندارید ");
    //   error.statusCode = 401;
    //   throw error;
    // }
    post.isAccept = req.body.data.toString();
    post.save();
    res.status(200).json({ message: "حله" });
  } catch (error) {
    next(error);
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
exports.createPost = async (req, res, next) => {
  const thumbnails = req.files ? Object.values(req.files) : [];
  const thumbnailsnames = [];
  try {
    const numberOfpostsa = await Blog.find({
      isAccept: "accept",
      user: req.userId,
    }).countDocuments();
    const numberOfpostsw = await Blog.find({
      isAccept: "waiting",
      user: req.userId,
    }).countDocuments();

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

    await Blog.create({
      ...req.body,
      user: req.userId,
      thumbnail: thumbnailsnames,
    });
    res.status(200).json({ message: "حله" });
  } catch (err) {
    next(err);
  }
};
exports.createGallery = async (req, res, next) => {
  const files = req.files ? Object.values(req.files) : [];
  try {
    const user = await User.findById(req.body.userId);
    if (!user) {
      const error = new Error("چنین یوزری نیست");
      error.statusCode = 404;
      throw error;
    }
    await files.forEach((element) => {
      const fileName = `${shortId.generate()}_${element.name}`;
      const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`;
      sharp(element.data)
        .jpeg({ quality: 60 })
        .toFile(uploadPath)
        .catch((err) => console.log(err));
      Gallery.create({
        user: req.body.userId,
        name: fileName,
      });
    });

    res.status(200).json({ message: "حله" });
  } catch (error) {
    next(error);
  }
};
exports.deleteGallery = async (req, res, next) => {
  try {
    const gallery = await Gallery.findByIdAndRemove(req.params.id);
    const filePath = `${appRoot}/public/uploads/thumbnails/${gallery.name}`;
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
      user: req.params.id,
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
    const post = await Blog.findById(req.body.postId);
    const user = await User.findById(req.body.userId);
    const { _id, name, email, profilePhoto } = user;
    const profile = { _id, name, email, profilePhoto };
    await post.joinedUsers.push(profile);
    post.save();
    res.status(200).json({ message: "حله" });
  } catch (err) {
    next(err);
  }
};
