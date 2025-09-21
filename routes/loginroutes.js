const express = require("express");
const authController = require("../controllers/auth/index");
const {verifyTempToken, verifyToken} = require("../middlewares/validation");
const vendorCtrl = require("../controllers/Admin/addHotelVendor.controller");

const router = express.Router();

router.post("/login", authController.loginUser);
router.post("/send/otp", authController.sendOtp);
router.post("/verify/otp", verifyTempToken, authController.verifyOtp);
router.patch(
  "/reset/password/:id",
  verifyTempToken,
  authController.resetpassword
);
// Vendor route
router.post("/add-vendor", verifyToken, vendorCtrl.addVendor);

module.exports = router;
