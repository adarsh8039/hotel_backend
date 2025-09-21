const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const logger = require("../../utils/logger");

dotenv.config({path: ".env"});
const {prisma} = require("../../models/connection");

const loginVendor = async (req, res) => {
  try {
    const {email, password} = await req.body;

    if (!email) {
      return res
        .status(400)
        .json({status: false, message: "Please enter email"});
    }
    if (!password) {
      return res
        .status(400)
        .json({status: false, message: "Please enter password"});
    }

    // const user = await prisma.guestmaster.findFirst({
    //   where: {
    //     OR: [{ login_email: email }, { password }],
    //   },
    //   select: {
    //     id: true,
    //     role_id: true,
    //     fullname: true,
    //     password: true,
    //     privacy: true,
    //     privacy_password: true,
    //     image: true,
    //     default_checkin: true,
    //     default_checkout: true,
    //     rolemaster: {
    //       select: {
    //         role: true,
    //       },
    //     },
    //   },
    // });
    const user = await prisma.users.findFirst({
      where: {
        OR: [{email: email}, {password}],
      },
      select: {
        id: true,
        role_id: true,
        fullname: true,
        password: true,
        // privacy: true,
        // privacy_password: true,
        // image: true,
        // default_checkin: true,
        // default_checkout: true,
        rolemaster: {
          select: {
            role: true,
          },
        },
      },
    });
    // console.log(user);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({status: false, message: "User not found"});
    }

    // Check if the provided password matches the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({status: false, message: "Invalid password"});
    }

    // Fetch additional user information like role_id and role_name from the database
    const {
      role_id,
      fullname,
      image,
      id,
      //   privacy,
      //   privacy_password,
      //   default_checkin,
      //   default_checkout,
      rolemaster: {role},
    } = user;

    // Fetch role details from role_master table
    const roleDetails = await prisma.rolemaster.count({
      where: {
        id: role_id,
      },
    });

    // Check if roleDetails is not null
    if (roleDetails === 0) {
      return res.status(404).json({status: false, message: "Role not found"});
    }

    // Fetch JWT secret key from environment variable
    const jwtSecret = process.env.JWT_SECRET;

    // Generate JWT token using the secret key from the environment variable
    const jwtData = {
      id,
      fullname,
      role_id,
      image,
      role,
      //   privacy,
      //   privacy_password,
      //   default_checkin,
      //   default_checkout,
    };
    const token = jwt.sign(jwtData, jwtSecret, {expiresIn: "48h"});

    res.status(200).json({
      status: true,
      message: "Login successful",
      username: fullname,
      id: id,
      role: role,
      //   default_checkin,
      //   privacy,
      //   privacy_password,
      image,
      //   default_checkout,
      token,
    });
  } catch (error) {
    logger.error(error);
    console.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

module.exports = {loginVendor};
