const { Router } = require("express");

const blogController = require("../controllers/blogController");

const router = new Router();

//  @desc   Weblog Index Page
//  @route  GET /
router.get("/getall/:city", blogController.getIndex);
router.get("/getPopularCamps/:city", blogController.getPopularCamps);
router.get("/getPopularTours/:city", blogController.getPopularTours);

router.get("/getCampTours/:id", blogController.getCampTours);
router.get("/getCampGallery/:id", blogController.getCampGallery);
router.get("/getcampleaders/:id", blogController.getCampLeaders);

//  @desc   Weblog Post Page
//  @route  GET /post/:id
router.get("/post/:id", blogController.getSinglePost);
router.get("/joinedusers/:id", blogController.getpostjoiners);
router.get("/user/:id", blogController.getSingleuser);
router.post("/relatedTours", blogController.getRelatedTours);

//  @desc   Weblog Numric Captcha
//  @route  GET /captcha.png
router.get("/captcha.png", blogController.getCaptcha);

//  @desc   Handle Contact Page
//  @route  POST /contact
router.post("/contact", blogController.handleContactPage);
router.post("/searchtour", blogController.searchTour);

module.exports = router;
