const { Router } = require("express");
const { authenticated } = require("../middlewares/auth");

const adminController = require("../controllers/adminController");

const router = new Router();
router.get("/getMyPosts/:id",authenticated, adminController.getMyPosts);
router.get("/requestedPosts",authenticated, adminController.requestedPosts);
router.get("/requestedTours",authenticated, adminController.requestedTours);
router.put("/add-permissions",authenticated, adminController.addPermissions);
router.get("/get-permissions/:id", authenticated,adminController.permissions);

router.get("/get-gallery/:id", authenticated,adminController.gallery);
router.get("/getsinglePost/:id",authenticated, adminController.getSinglePost);
router.post("/add-gallery",authenticated, adminController.createGallery);
router.put("/join-tour",authenticated, adminController.joinTour);
router.put("/delte-galley/:name",authenticated, adminController.deleteGallery);

//  @desc   Dashboard Delete Post
//  @route  GET /dashboard/delete-post/:id
router.delete("/delete-post/:id", authenticated, adminController.deletePost);
router.delete("/delete-gallery/:id", authenticated, adminController.deleteGallery);

//  @desc   Dashboard Handle Post Creation
//  @route  POST /dashboard/add-post
router.post("/add-post", authenticated, adminController.createPost);

//  @desc   Dashboard Handle Post Edit
//  @route  POST /dashboard/edit-post/:id
router.put("/edit-post/:id", authenticated, adminController.editPost);

//  @desc   Dashboard Handle Image Upload
//  @route  POST /dashboard/image-upload
router.post("/image-upload", authenticated, adminController.uploadImage);
//@desc Accept post
//@route PUT /dashboard/acceptPost
router.put("/accept-post", authenticated, adminController.acceptPost);

module.exports = router;
