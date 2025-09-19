const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const verifyToken = (req, res, next) => {
  try {
    // Check if the request path starts with /uploads/image/
    if (req.path.startsWith("/uploads/image/")) {
      return next(); // Skip token verification for image paths
    }

    //   logger.info(req.headers);
    const token = req.headers.authorization;
    logger.info(token);
    const user = {};

    if (!token) {
      return res
        .status(401)
        .json({ status: false, message: "Unauthorized: No token provided" });
    }

    jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (error, decoded) => {
      if (error) {
        return res
          .status(401)
          .json({ status: false, message: "Unauthorized: Invalid token" });
      }

      // Attach user information to the request
      user.userId = decoded.userId;
      user.roleId = decoded.role_id;
      user.role = decoded.role;
      // logger.info(user);

      // Check if the user has the required role (admin in this case)
      if (user.role !== "Admin") {
        return res
          .status(403)
          .json({ status: false, message: "Forbidden: Admin access required" });
      }

      next();
    });
  } catch (error) {
    console.error(error);
    logger.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

const verifyTempToken = (req, res, next) => {
  try {
    let token = req.headers["authorization"];

    if (!token) {
      return res
        .status(403)
        .json({ status: false, message: "No token provided" });
    }

    // Check if the token starts with "Bearer " and remove it
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }

    jwt.verify(token, process.env.TEMP_JWT_SECRET, (error, decoded) => {
      if (error) {
        console.error("Token verification error:", error); // Log the error for debugging
        return res
          .status(500)
          .json({ status: false, message: "Failed to authenticate token" });
      }

      // If everything is good, save to request for use in other routes
      req.user = {
        id: decoded.user_id,
        otp_timestamp: decoded.otp_timestamp,
        sec_code: decoded.sec_code,
      };

      next();
    });
  } catch (error) {
    console.error(error);
    logger.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

module.exports = { verifyToken, verifyTempToken };
