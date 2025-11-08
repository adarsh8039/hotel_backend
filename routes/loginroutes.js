const express = require("express");
const authController = require("../controllers/auth/index");
const {verifyTempToken, verifyToken} = require("../middlewares/validation");
const vendorCtrl = require("../controllers/Admin/addHotelVendor.controller");
const {upload} = require("../models/multerSchema");

const router = express.Router();

router.post("/login", authController.loginUser);
router.post("/send/otp", authController.sendOtp);
router.post("/verify/otp", verifyTempToken, authController.verifyOtp);
router.post("/reset/password", verifyToken, authController.resetpassword);
router.get("/profile-details", verifyToken, authController.getUserProfiles);
router.put(
  "/update-profile",
  [upload.fields([{name: "image", maxCount: 1}, {name: "images"}])],
  verifyToken,
  authController.updateUserProfile
);
// Vendor route
router.post("/add-vendor", verifyToken, vendorCtrl.addVendor);

module.exports = router;
