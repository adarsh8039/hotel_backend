const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const dotenv = require("dotenv");
dotenv.config({path: ".env"});
const {JWT_SECRET} = process.env;

function generateToken(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, {expiresIn: "48h"});
  } catch (error) {
    console.error(error);
    logger.error(error);
  }
}

module.exports = {generateToken};
