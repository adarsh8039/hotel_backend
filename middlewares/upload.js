const multer = require("multer");
const path = require("path");
const logger = require("../utils/logger");

// Storage engine for 'guest' uploads
const guestStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/guests");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

// Storage engine for 'room' uploads
const roomStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/rooms");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

// Storage engine for 'food' uploads
const foodstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/foods");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

// Check file type
function checkFileType(file, cb) {
  try {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images Only!");
    }
  } catch (error) {
    console.error(error);
    logger.error(error);
  }
}

// Init upload for 'guest'
const guestUpload = multer({
  storage: guestStorage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("document_images");

// Init upload for 'room' (multiple images)
const roomUpload = multer({
  storage: roomStorage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).array("images", 7);

const foodUpload = multer({
  storage: foodstorage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).array("images", 7);

module.exports = { guestUpload, roomUpload, foodUpload };
