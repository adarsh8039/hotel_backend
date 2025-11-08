const multer = require("multer");
const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx");
const logger = require("../utils/logger");
// Base uploads directory
const baseUploadDir = path.join(__dirname, "../uploads");

// Function to create a dynamic folder path
const getFolderPath = (req, file) => {
  try {
    let subfolder = "";

    if (req.body.item_code) {
      subfolder = "foods";
    } else if (req.body.title) {
      subfolder = "rooms";
    } else if (req.body.email) {
      subfolder = "guests";
    } else if (req.body.document_images) {
      subfolder = "guests";
    } else if (req.body.adv_payment) {
      subfolder = "guests";
    } else if (req.body.image) {
      subfolder = "guests";
    } else {
      subfolder = "guests";
    }

    return path.join(baseUploadDir, subfolder);
  } catch (error) {
    logger.error(error);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const folderPath = getFolderPath(req, file);

      // Ensure the folder exists
      fs.mkdirSync(folderPath, {recursive: true});

      cb(null, folderPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const fileLocation = `${file.fieldname}_${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, fileLocation);
  },
});

const ChecImage = (req, res, next) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({status: false, message: "Image is required!"});
    }
    if (!req.files || !req.files.length) {
      return res
        .status(400)
        .json({status: false, message: "Image is required!"});
    }
    next();
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: "Internal Server Error"});
  }
};

const filestorage = multer.memoryStorage();
const fileupload = multer({storage: filestorage});

const upload = multer({storage});

// Define storage strategy
// Updated image storage configuration
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/guests"); // Adjusted path

    // Ensure the upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, {recursive: true});
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const uniqueName = `document_image_${timestamp}.png`;
    cb(null, uniqueName);
  },
});

const Imageupload = multer({storage: imageStorage});

module.exports = {upload, ChecImage, fileupload, Imageupload};
