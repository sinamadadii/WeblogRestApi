const { Router } = require("express");

const userController = require("../controllers/userController");
const { authenticated } = require("../middlewares/auth");

const router = new Router();

//  @desc   Login Handle
//  @route  POST /users/login
router.post("/login", userController.handleLogin);

router.put("/accept-tour", authenticated, userController.acceptTour);
router.post("/edit-profile", authenticated, userController.editProfile);
router.get("/profile", authenticated, userController.userProfile);
router.post("/changepassword", authenticated,userController.handleChangePassword);

router.post("/uploadphoto", authenticated, userController.uploadProfilePhoto);
router.delete("/deleteProfile/:name", authenticated, userController.deleteProfile);

router.get("/isAuth", userController.isAuth);

//  @desc   Handle Forget Password
//  @route  POST /users/forget-password
router.post("/forget-password", userController.handleForgetPassword);

//  @desc   Handle reset Password
//  @route  POST /users/reset-password/:token
router.post("/reset-password",userController.handleResetPassword);
router.post("/changePassword", authenticated,userController.handleChangePassword);

//  @desc   Register Handle
//  @route  POST /users/register
router.post("/register", userController.createUser);
router.post("/recievecode", userController.handleForgetPasswordResieved);

module.exports = router;
