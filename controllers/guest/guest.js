const {prisma} = require("../../models/connection");
const logger = require("../../utils/logger");
const jwt = require("jsonwebtoken");
const imagePath = "https://api.hotel.msquaretec.com";
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const xlsx = require("xlsx");
const express = require("express");
const bcrypt = require("bcrypt");
const NodeCache = require("node-cache");
const myCache = new NodeCache();

// add guest
const addguest = async (req, res, next) => {
  try {
    const {userDetails} = req.headers;
    let data = await req.body;

    // Conditionally update document_images only if req.files.document_images exists
    // if (req.files.document_images) {
    //   data.document_images = `${req.files.document_images[0].filename}`;
    // }

    let document_images = null;
    console.log("req.files", req.files);
    if (req?.files && req?.files?.document_images?.length > 0) {
      document_images = req.files.document_images
        .map((file) => `${file.filename}`)
        .join(",");
    }

    // Conditionally update image only if req.files.image exists
    if (req.files.image) {
      // Get the path to the uploaded file
      data.image = `${req.files.image[0].filename}`;
    }

    const role = await prisma.rolemaster.findFirst({
      where: {role: "User"},
    });
    if (!role) {
      res.status(422).json({status: false, message: "Role not found!"});
    }

    // Create the guest entry in the database
    const guest = await prisma.guestmaster.create({
      data: {
        role_id: role.id,
        fullname: data.fullname,
        email: data.email,
        phone_number: data.phone_number,
        address: data.address,
        document: data.document,
        gst_number: data.gst_number,
        document_images: document_images,
        nationality: data.nationality,
        company_name: data.company_name,
        gender: data.gender,
        user_id: userDetails.id,
      },
      select: {
        id: true,
      },
    });

    myCache.del("Guest"); // Invalidate the cache
    res
      .status(200)
      .json({status: true, message: "Guest inserted successfully!", guest});
  } catch (error) {
    console.log(error);
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

// view enable guests
const allguests = async (req, res, next) => {
  try {
    const {userDetails} = req.headers;

    const count = await prisma.guestmaster.count({
      where: {user_id: userDetails.id},
    });
    console.log(count);

    if (count === 0) {
      return res.status(404).json({status: false, message: "Data not found"});
    } else {
      const result = await prisma.guestmaster.findMany({
        where: {
          user_id: userDetails.id,
          NOT: [
            {
              role_id: 1,
            },
            {
              status: false,
            },
          ],
        },
        include: {
          reservationmaster: {
            where: {
              status: {
                not: "BOOKED",
              },
            },
            select: {
              id: true,
              check_in: true,
              check_out: true,
            },
          },
          user: {
            select: {
              id: true,
              fullname: true,
              email: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      });

      result.forEach((item) => {
        item.document_images = item.document_images
          ? item.document_images.split(",")
          : [];
      });

      const formattedResult = result.map((guest) => {
        const {user, ...rest} = guest;
        return {
          ...rest,
          created_by: user, // renamed alias
        };
      });

      return res.status(200).json({
        status: true,
        message: "Data fetched successfully",
        result: formattedResult,
      });
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).json({status: false, message: error.message});
  }
};

// all guest
const viewguests = async (req, res, next) => {
  try {
    const count = await prisma.guestmaster.count();

    if (count === 0) {
      return res.status(404).json({status: false, message: "Data not found"});
    } else {
      const result = await prisma.guestmaster.findMany({
        where: {
          NOT: [
            {
              role_id: 1,
            },
          ],
        },
        orderBy: {
          id: "asc",
        },
      });

      result.forEach((item) => {
        item.document_images = item.document_images
          ? item.document_images.split(",")
          : [];
      });

      return res.status(200).json({
        status: true,
        message: "Data fetched successfully",
        result,
      });
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).json({status: false, message: error.message});
  }
};

//specefic guest
const speceficguest = async (req, res, next) => {
  try {
    const id = +(await req.params.id);
    const {userDetails} = req.headers;
    const count = await prisma.guestmaster.count({
      where: {
        id,
        user_id: userDetails.id,
      },
    });
    if (count === 0) {
      res.status(404).json({status: false, message: "data not found"});
    } else {
      const result = await prisma.guestmaster.findFirst({
        where: {
          id,
        },
        include: {
          reservationmaster: {
            where: {
              status: {
                not: "BOOKED",
              },
            },
            select: {
              id: true,
              check_in: true,
              check_out: true,
            },
          },
          user: {
            select: {
              id: true,
              fullname: true,
              email: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      });

      if (result && result.user) {
        result.created_by = result.user;
        delete result.user;
      }

      result.document_images = result.document_images
        ? result.document_images.split(",")
        : [];

      res
        .status(200)
        .json({status: true, message: "data fetched successfully", result});
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//edit guest
const editguest = async (req, res, next) => {
  try {
    const {id} = req.params;
    const data = req.body;

    // Fetch current guest data to retain current document_images and image if not updated
    const currentGuest = await prisma.guestmaster.findUnique({
      where: {id: +id},
    });

    let updateData = {
      ...data,
      role_id: 2,
    };

    // Handle existing images from the database
    let currentImages = currentGuest.document_images
      ? currentGuest.document_images.split(",")
      : [];

    // Add new images from req.files to currentImages
    let uploadedImages = [];
    if (
      req?.files &&
      req?.files?.document_images &&
      req?.files?.document_images?.length > 0
    ) {
      uploadedImages = req.files?.document_images?.map((file) => file.filename);
    }

    if (data?.document_images) {
      let beforeDeleteImages = Array.isArray(data.document_images)
        ? [...data.document_images]
        : data.document_images.split(",");
      let afterDeleteImages = [];
      currentImages.forEach((image) => {
        if (beforeDeleteImages.includes(image)) {
          afterDeleteImages.push(image);
        } else {
          const imagePath = path.join(
            __dirname,
            "..",
            "..",
            "uploads",
            "guests",
            image.trim()
          );
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      });
      uploadedImages = [...uploadedImages, ...afterDeleteImages];
    } else {
      currentImages.forEach((image) => {
        const imagePath = path.join(
          __dirname,
          "..",
          "..",
          "uploads",
          "guests",
          image.trim()
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }
    updateData.document_images = uploadedImages.join(",");

    const result = await prisma.guestmaster.update({
      data: updateData,
      where: {id: +id},
      select: {id: true, document_images: true, image: true},
    });

    myCache.del("Guest"); // Invalidate the cache
    res.status(200).json({
      status: true,
      message: "Guest details updated successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//edit profile
const editprofile = async (req, res, next) => {
  try {
    // Extract user ID from the token
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.id;

    // Extract data from the request body
    const data = req.body;

    // Initialize the updateData object with the data from req.body
    let updateData = {...data};

    // Conditionally update image only if req.file exists
    if (req.file) {
      // Delete old image if exists
      const currentGuest = await prisma.guestmaster.findUnique({
        where: {id: +userId},
      });

      if (currentGuest.image) {
        const imagePath = path.resolve(
          __dirname,
          "../../",
          "uploads",
          "guests",
          currentGuest.image
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      updateData.image = req.file.filename;
    } else {
      // Ensure no unexpected keys like 'images' are present in updateData
      delete updateData.images;
    }

    const result = await prisma.guestmaster.update({
      data: updateData,
      where: {id: +userId},
      select: {
        id: true,
        image: true,
        default_checkin: true,
        default_checkout: true,
        fullname: true,
      },
    });

    res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//delete guest
const disableguest = async (req, res, next) => {
  try {
    const id = +(await req.params.id);
    const {userDetails} = req.headers;

    const currentGuest = await prisma.guestmaster.findUnique({
      where: {
        id: +id,
      },
    });

    if (currentGuest.image) {
      const imagePath = path.resolve(
        __dirname,
        "../../",
        "uploads",
        "image",
        currentGuest.image
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    const result = await prisma.guestmaster.update({
      data: {
        status: false,
      },
      where: {
        id,
      },
      select: {
        id: true,
      },
    });
    res
      .status(200)
      .json({status: true, message: "Guest deleted successfully", result});
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//add customer by excel
const addguestbyexcel = async (req, res) => {
  try {
    const {userDetails} = req.headers;
    // Ensure req.file is defined
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "No file uploaded",
      });
    }

    // Read the uploaded Excel file from memory
    const workbook = xlsx.read(req.file.buffer, {type: "buffer"});
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert the worksheet to JSON
    const data = xlsx.utils.sheet_to_json(worksheet, {raw: false});

    // Iterate over each row in the JSON data and insert into the database
    const promises = data.map(async (item) => {
      await prisma.guestmaster.create({
        data: {
          role_id: 2,
          document: item.document || "",
          user_id: userDetails.id,
          ...item,
        },
      });
    });

    // Wait for all insert operations to complete
    await Promise.all(promises);

    // Send success response
    res.status(200).json({
      status: true,
      message: "Guests inserted successfully!",
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//get guest privacy
const getGuestPrivacy = async (req, res, next) => {
  try {
    // Extract user ID from the token
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.id;

    console.log("req.body", req.body);

    const currentGuest = await prisma.guestmaster.findUnique({
      where: {id: +userId},
      select: {
        privacy_status: true,
      },
    });

    if (!currentGuest) {
      res.status(404).json({status: false, message: "data not found"});
    } else {
      res.status(200).json({
        status: true,
        message: "Profile updated successfully",
        result: currentGuest,
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//change guest privacy
const changeGuestPrivacy = async (req, res, next) => {
  try {
    // Extract user ID from the token
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.id;

    const privacyStatus = req.body.privacy;

    // Fetch current guest details
    const currentGuest = await prisma.guestmaster.findUnique({
      where: {id: +userId},
      select: {
        privacy: true,
        privacy_status: true,
        privacy_password: true,
      },
    });

    // If privacy_status is 1 update to enable privacy
    if (privacyStatus === true) {
      const result = await prisma.guestmaster.update({
        data: {privacy_status: privacyStatus},
        where: {id: +userId},
        select: {privacy_status: true},
      });
      return res.status(200).json({
        status: true,
        message: "Privacy enabled successfully",
        result,
      });
    }
    // If privacy_status is 0  verify password and unlock privacy
    else if (privacyStatus === false) {
      if (req.body.password) {
        // Verify privacy password
        const passwordMatch = await bcrypt.compare(
          req.body.password,
          currentGuest.privacy_password
        );

        if (!passwordMatch) {
          return res.status(400).json({
            status: false,
            message: "Incorrect password provided",
          });
        }
      } else {
        return res.status(400).json({
          status: false,
          message: "Password is required to disable privacy",
        });
      }

      // Update privacy status to false (unlocked)
      const result = await prisma.guestmaster.update({
        data: {privacy_status: false},
        where: {id: +userId},
        select: {privacy_status: true},
      });

      return res.status(200).json({
        status: true,
        message: "Privacy unlocked successfully!",
        result,
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Invalid privacy status value",
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//change privacy password
const changePPassword = async (req, res, next) => {
  try {
    // Extract user ID from the token
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    const privacy = req.body.privacy;
    // Get the user's current hashed password from the database
    const admin = await prisma.guestmaster.findUnique({
      where: {
        id: userId,
      },
      select: {
        fullname: true,
        privacy_password: true,
        privacy: true,
        email: true,
        phone_number: true,
        password: true,
        address: true,
        gst_number: true,
        default_checkin: true,
        default_checkout: true,
        image: true,
        privacy_status: true,
        nationality: true,
        gender: true,
      },
    });

    // Verify old password provided
    if (req.body.oldPassword) {
      const oldPasswordMatch = await bcrypt.compare(
        req.body.oldPassword,
        admin.privacy_password
      );

      if (!oldPasswordMatch) {
        return res
          .status(400)
          .json({status: false, message: "Old password is incorrect"});
      }
    }

    // Hash the new password provided
    let newPPasswordHash = admin.privacy_password; // Default to current password
    if (req.body.newPPassword) {
      newPPasswordHash = await bcrypt.hash(req.body.newPPassword, 10);
    }

    // Prepare data object for update
    let updateData = {
      privacy_password: newPPasswordHash,
      privacy: privacy,
    };

    // Update the details in the database
    const result = await prisma.guestmaster.update({
      where: {
        id: userId,
      },
      data: {
        ...updateData,
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        privacy: true,
        privacy_password: true,
      },
    });

    res.status(200).json({
      status: true,
      message: "Details updated successfully",
      result,
    });
  } catch (error) {
    console.error("Error updating user details:", error); // Log error
    res.status(500).json({status: false, message: error.message});
  }
};

//verify privacy password
const verifyPPassword = async (req, res, next) => {
  try {
    // Extract user ID from the token
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.id;
    // Get the user's current hashed password from the database
    const admin = await prisma.guestmaster.findUnique({
      where: {
        id: userId,
      },
      select: {
        privacy_password: true,
      },
    });

    // Verify privacy password provided
    if (req.body.Ppassword) {
      const PPasswordMatch = await bcrypt.compare(
        req.body.Ppassword,
        admin.privacy_password
      );

      if (!PPasswordMatch) {
        return res
          .status(400)
          .json({status: false, message: "Password is incorrect"});
      }
    }
    res.status(200).json({
      status: true,
      message: "Unlock successfully!",
    });
  } catch (error) {
    console.error("Error unlock privacy:", error); // Log error
    res.status(500).json({status: false, message: error.message});
  }
};

//date filtering
const allguestswithdatefiltering = async (req, res, next) => {
  try {
    let {from, to} = req.body;
    from = new Date(from);
    to = new Date(to);
    const count = await prisma.guestmaster.count();

    if (count === 0) {
      return res.status(404).json({status: false, message: "Data not found"});
    } else {
      const result = await prisma.guestmaster.findMany({
        where: {
          AND: [
            {
              created_at: {
                gte: from,
                lte: to,
              },
            },
          ],
          NOT: [
            {
              role_id: 1,
            },
            {
              status: false,
            },
          ],
        },
        include: {
          reservationmaster: {
            where: {
              status: {
                not: "BOOKED",
              },
            },
            select: {
              id: true,
              check_in: true,
              check_out: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      });

      result.forEach((item) => {
        item.document_images = item.document_images
          ? item.document_images.split(",")
          : [];
      });

      return res.status(200).json({
        status: true,
        message: "Data fetched successfully",
        result,
      });
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).json({status: false, message: error.message});
  }
};

const editInvoiceStampAndSignImages = async (req, res, next) => {
  try {
    // Extract user ID from the token
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.id;

    // Extract data from the request body
    const data = req.body;

    // Initialize the updateData object with the data from req.body
    let updateData = {...data};
    if (req?.files) {
      // Delete old image if exists
      const currentGuest = await prisma.users.findUnique({
        where: {id: +userId},
      });

      if (req?.files?.stamp_image?.[0]) {
        if (currentGuest?.stamp_image) {
          const imagePath = path.resolve(
            __dirname,
            "../../",
            "uploads",
            "guests",
            currentGuest?.stamp_image
          );
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
        updateData.stamp_image = req?.files?.stamp_image?.[0]?.filename;
      }

      if (req?.files?.sign_image?.[0]) {
        if (currentGuest?.sign_image) {
          const imagePath = path.resolve(
            __dirname,
            "../../",
            "uploads",
            "guests",
            currentGuest?.sign_image
          );
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
        updateData.sign_image = req?.files?.sign_image?.[0]?.filename;
      }
    } else {
      if (updateData?.stamp_image) {
        delete updateData?.stamp_image;
      }
      if (updateData?.stamp_image) {
        delete updateData?.sign_image;
      }
    }

    const result = await prisma.users.update({
      data: updateData,
      where: {id: +userId},
      select: {
        id: true,
        image: true,
        // default_checkin: true,
        // default_checkout: true,
        fullname: true,
      },
    });

    res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({status: false, message: error.message});
  }
};

module.exports = {
  addguest,
  allguests,
  speceficguest,
  editguest,
  editprofile,
  disableguest,
  addguestbyexcel,
  changeGuestPrivacy,
  getGuestPrivacy,
  changePPassword,
  verifyPPassword,
  viewguests,
  allguestswithdatefiltering,
  editInvoiceStampAndSignImages,
};
