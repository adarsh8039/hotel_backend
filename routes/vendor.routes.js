const express = require("express");
const loginVendor = require("../controllers/vendor/auth.controller");
const router = express.Router();

router.post("/login", loginVendor.loginVendor);

module.exports = router;
