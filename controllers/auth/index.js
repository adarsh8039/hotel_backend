const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const speakeasy = require("speakeasy");
const logger = require("../../utils/logger");
const fs = require("fs");
const path = require("path");

dotenv.config({path: ".env"});
const {prisma} = require("../../models/connection");
const {token} = require("morgan");

const registerUser = async (req, res) => {
  try {
    const {fullname, email, password, phone_number} = req.body;

    // 🔍 Validate inputs
    if (!fullname) {
      return res
        .status(400)
        .json({status: false, message: "Full name is required"});
    }
    if (!email) {
      return res
        .status(400)
        .json({status: false, message: "Email is required"});
    }
    if (!password) {
      return res
        .status(400)
        .json({status: false, message: "Password is required"});
    }

    // 🔍 Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: {email},
    });

    if (existingUser) {
      return res
        .status(409)
        .json({status: false, message: "Email already registered"});
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🎭 Find role (default to "User" if not provided)
    const userRole = await prisma.rolemaster.findFirst({
      where: {role: "Admin"},
    });

    if (!userRole) {
      return res.status(404).json({status: false, message: "Role not found"});
    }

    // 🧑‍💻 Create new user
    const newUser = await prisma.users.create({
      data: {
        fullname,
        email,
        password: hashedPassword,
        phone_number: phone_number || "",
        role_id: userRole.id,
        status: true,
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        role_id: true,
        rolemaster: {select: {role: true}},
      },
    });

    // 🪪 Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET;
    const token = jwt.sign(
      {
        id: newUser.id,
        fullname: newUser.fullname,
        role_id: newUser.role_id,
        role: newUser.rolemaster.role,
      },
      jwtSecret,
      {expiresIn: "48h"}
    );

    // ✅ Response
    res.status(201).json({
      status: true,
      message: "Registration successful",
      user: {
        id: newUser.id,
        fullname: newUser.fullname,
        email: newUser.email,
        role: newUser.rolemaster.role,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Error in registerUser:", error);
    res.status(500).json({status: false, message: error.message});
  }
};

const loginUser = async (req, res) => {
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
      privacy,
      privacy_password,
      default_checkin,
      default_checkout,
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
      privacy,
      privacy_password,
      default_checkin,
      default_checkout,
    };
    const token = jwt.sign(jwtData, jwtSecret, {expiresIn: "48h"});

    res.status(200).json({
      status: true,
      message: "Login successful",
      username: fullname,
      id: id,
      role: role,
      default_checkin,
      privacy,
      privacy_password,
      image,
      default_checkout,
      token,
    });
  } catch (error) {
    logger.error(error);
    console.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//send otp
const sendOtp = async (req, res, next) => {
  try {
    let {email} = await req.body;
    const user = await prisma.guestmaster.findFirst({
      where: {
        login_email: email,
      },
      select: {
        id: true,
        login_email: true,
      },
    });

    if (!user) {
      return res.status(404).json({status: false, message: "User not found"});
    }

    // Determine whether to use SSL or TLS based on the mail configuration
    let smtpConfig = {
      service: "gmail",
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: true,
      logger: true,
      debug: true,
      secureConnection: false,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    };

    let transporter = nodemailer.createTransport(smtpConfig);
    let {otp, secret, timestamp} = generateOtp();
    req.app.set("otpSecret", secret);

    let body = `Dear ${login_email},
    
    We've received a request to reset your password for Hotel-Booking Management System. To proceed with resetting your password, 
    
    please use the following One-Time Passcode (OTP): ${otp} 
    
    at the password reset page to create new password for your account.
    
    This OTP is valid for a limited time for security purposes.

    If you did not request this password reset or have any concerns about your account security, please contact our support team immediately at [Support Contact Information] for assistance.

    Thank you,
    Hotel-Booking Management Team`;

    let mailOptions = {
      from: `"Hotel-Booking" <project@msquaretec.com>`,
      to: login_email,
      subject: "Reset Password with One-Time-Passcode (OTP) Request",
      text: body,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        logger.error(error);
        console.error(error);
        res.status(500).json({status: false, error: error});
      } else {
        console.log(`Message sent: ${info.messageId}`);

        // Generate temporary token
        const payload = {
          otp_timestamp: timestamp,
          user_id: user.id,
          email: user.email,
        };
        const token = jwt.sign(payload, process.env.TEMP_JWT_SECRET, {
          expiresIn: "2h",
        });

        return res.status(200).json({
          status: true,
          message: "Email sent successfully",
          result: {
            user_id: user.id,
            messageId: info.messageId,
            time_stamp: timestamp,
            token: token,
            email: user.email,
          },
        });
      }
    });
  } catch (error) {
    logger.error(error);
    console.error(error);
    res.status(404).send("404 not found");
  }
};

//verify otp
const verifyOtp = async (req, res, next) => {
  try {
    let {otp} = await req.body;
    let {time_stamp} = await req.query;

    let secret = req.app.get("otpSecret");
    console.log("secret coming from session :>>", secret);
    const otpValidWindow = 4 * 30 * 1000; // OTP valid for 2 steps (60 seconds)

    let verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: otp,
      window: 0,
      step: 60,
    });

    console.log("verified :>>", verified);

    if (verified) {
      console.log(`otp verified`);
      res.status(200).json({status: true, message: "otp verified"});
    } else if (Date.now() - time_stamp > otpValidWindow) {
      console.log(`OTP expired`);
      res.status(200).json({status: false, message: "OTP expired"});
    } else {
      console.log(`Invalid OTP`);
      res.status(200).json({status: false, message: "Invalid OTP"});
    }
  } catch {
    logger.error(error);
    console.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//generate otp
const generateOtp = () => {
  try {
    // Generate a secret key
    const secret = speakeasy.generateSecret({length: 10}); // Adjust the length as needed

    // Get the OTP for the current time
    const otp = speakeasy.totp({
      secret: secret.base32,
      encoding: "base32",
      digits: 6,
      step: 60,
    });

    let timestamp = Date.now(); // Record the timestamp of OTP generation

    console.log("Secret:", secret.base32); // Store this secret securely for verification
    console.log("Timestamp:", timestamp); // Store this secret securely for verification
    console.log("Current OTP:", otp);

    return {secret: secret.base32, otp, timestamp};
  } catch (error) {
    logger.error(error);
    console.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//reset password
const resetpassword = async (req, res, next) => {
  try {
    const {userDetails} = req.headers;
    let Id = +userDetails.id;

    const {old_password, new_password} = req.body;

    // ✅ Validate inputs
    if (!old_password || !new_password) {
      return res.status(400).json({
        status: false,
        message: "Old and new passwords are required",
      });
    }

    // ✅ Fetch the existing user record
    const user = await prisma.users.findUnique({
      where: {id: Id},
      select: {id: true, password: true},
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // ✅ Verify old password
    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Incorrect old password",
      });
    }

    // ✅ Hash the new password
    const newPasswordHash = await bcrypt.hash(new_password, 10);

    // ✅ Update user's password
    const result = await prisma.users.update({
      where: {id: Id},
      data: {password: newPasswordHash},
      select: {id: true},
    });

    console.log("Password updated successfully:", result);

    res.status(200).json({
      status: true,
      message: "Password updated successfully",
      result,
    });
  } catch (error) {
    logger?.error?.(error);
    console.error("Error updating password:", error);
    res.status(500).json({status: false, message: error.message});
  }
};

const getUserProfiles = async (req, res) => {
  try {
    const {userDetails} = req.headers;

    if (!userDetails || !userDetails.id) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized: Missing user details",
      });
    }

    const userId = +userDetails.id;

    // Fetch user with selected fields
    const user = await prisma.users.findUnique({
      where: {id: userId},
      select: {
        id: true,
        fullname: true,
        email: true,
        phone_number: true,
        image: true,
        sign_image: true,
        stamp_image: true,
        gst_number: true,
        role_id: true,
        status: true,
        address: true,
        created_at: true,
        updated_at: true,
        rolemaster: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (error) {
    logger?.error?.(error);
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      status: false,
      message: "Something went wrong while fetching profile",
      error: error.message,
    });
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const {userDetails} = req.headers;

    if (!userDetails || !userDetails.id) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized: Missing user details",
      });
    }

    const userId = +userDetails.id;
    const {fullname, phone_number, gst_number, address} = req.body;

    const updateData = {};

    // Fetch current user for deleting old images
    const currentUser = await prisma.users.findUnique({
      where: {id: userId},
    });

    // ------------------------------
    // 1️⃣ UPDATE PROFILE IMAGE
    // ------------------------------
    if (req?.files?.image && req.files.image.length > 0) {
      // delete old image
      if (currentUser?.image) {
        const imagePath = path.resolve(
          __dirname,
          "../../",
          "uploads",
          "users",
          currentUser.image
        );

        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }

      updateData.image = req.files.image[0].filename;
    }

    // ------------------------------
    // 2️⃣ UPDATE SIGN IMAGE
    // ------------------------------
    if (req?.files?.sign_image && req.files.sign_image.length > 0) {
      if (currentUser?.sign_image) {
        const signPath = path.resolve(
          __dirname,
          "../../",
          "uploads",
          "users",
          currentUser.sign_image
        );

        if (fs.existsSync(signPath)) fs.unlinkSync(signPath);
      }

      updateData.sign_image = req.files.sign_image[0].filename;
    }

    // ------------------------------
    // 3️⃣ UPDATE STAMP IMAGE
    // ------------------------------
    if (req?.files?.stamp_image && req.files.stamp_image.length > 0) {
      if (currentUser?.stamp_image) {
        const stampPath = path.resolve(
          __dirname,
          "../../",
          "uploads",
          "users",
          currentUser.stamp_image
        );

        if (fs.existsSync(stampPath)) fs.unlinkSync(stampPath);
      }

      updateData.stamp_image = req.files.stamp_image[0].filename;
    }

    // ------------------------------
    // 4️⃣ OTHER FIELDS
    // ------------------------------
    if (fullname) updateData.fullname = fullname;
    if (phone_number) updateData.phone_number = phone_number;
    if (gst_number) updateData.gst_number = gst_number;
    if (address) updateData.address = address;

    // Ensure at least one field to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: false,
        message: "Please provide at least one field to update",
      });
    }

    // ------------------------------
    // 5️⃣ UPDATE IN DATABASE
    // ------------------------------
    const updatedUser = await prisma.users.update({
      where: {id: userId},
      data: updateData,
      select: {
        id: true,
        fullname: true,
        email: true,
        phone_number: true,
        image: true,
        sign_image: true,
        stamp_image: true,
        gst_number: true,
        address: true,
        role_id: true,
        status: true,
        updated_at: true,
        rolemaster: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    logger?.error?.(error);
    console.error("Error updating user profile:", error);
    res.status(500).json({
      status: false,
      message: "Something went wrong while updating profile",
      error: error.message,
    });
  }
};

module.exports = {
  loginUser,
  sendOtp,
  verifyOtp,
  resetpassword,
  getUserProfiles,
  updateUserProfile,
  registerUser,
};
