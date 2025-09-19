const express = require("express");
const authController = require("../controllers/auth/index");
const {verifyTempToken} = require("../middlewares/validation");

const router = express.Router();

router.post("/login", authController.loginUser);
router.post("/send/otp", authController.sendOtp);
router.post("/verify/otp", verifyTempToken, authController.verifyOtp);
router.patch(
  "/reset/password/:id",
  verifyTempToken,
  authController.resetpassword
);

module.exports = router;
