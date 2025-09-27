const {prisma} = require("../../models/connection");
const logger = require("../../utils/logger");
const {convertToIndianStandard} = require("../../utils/dateFormatter");
const imagePath = "https://api.hotel.msquaretec.com";
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const xlsx = require("xlsx");
const express = require("express");

// add rooms
const addrooms = async (req, res, next) => {
  try {
    let images = null;

    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => `${file.filename}`).join(",");
    }

    const data = req.body;
    const {userDetails} = req.headers;

    const room = await prisma.roommaster.create({
      data: {
        title: data.title,
        floor_no: data.floor_no,
        images: images,
        bed_type: data.bed_type,
        facilities: data.facilities,
        perdayprice: +data.perdayprice,
        description: data.description,
        tax_type: data.tax_type,
        room_size: data.room_size,
        user_id: userDetails.id,
      },
      select: {
        id: true,
      },
    });

    res
      .status(200)
      .json({status: true, message: "Room inserted successfully!", room});
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

// disable rooms
const changeRoomDisabled = async (req, res, next) => {
  try {
    const data = await req.body;
    const room_id = +(await req.params.id);

    const result = await prisma.roommaster.update({
      data: {
        disabled: data?.disabled,
      },
      where: {
        id: room_id,
      },
      select: {
        disabled: true,
      },
    });

    if (result?.disabled) {
      res
        .status(200)
        .json({status: true, message: "Room has been disabled!", result});
    } else {
      res
        .status(200)
        .json({status: true, message: "Room has been enabled!", result});
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

// view rooms
const allrooms = async (req, res, next) => {
  try {
    let {check_in, check_out} = req.body;

    // Convert input times to UTC
    check_in = new Date(check_in).toISOString();
    check_out = new Date(check_out).toISOString();

    let rooms = await prisma.roommaster.findMany({
      orderBy: {
        title: "asc",
      },
    });

    if (rooms.length === 0) {
      return res.status(404).json({status: false, message: "data not found"});
    }

    let reservations = await prisma.reservationmaster.findMany({
      where: {
        AND: [
          {
            check_in: {
              lt: check_out,
            },
          },
          {
            check_out: {
              gt: check_in,
            },
          },
          {
            status: "BOOKED",
          },
        ],
      },
      select: {
        user_id: true,
        room_id: true,
        check_in: true,
        check_out: true,
        booking_date: true,
        total_days: true,
        taxable_price: true,
        cancel_date: true,
        cgst: true,
        igst: true,
        sgst: true,
        status: true,
        total_price: true,
        adv_payment: true,
        after_discount_price: true,
        arrival_time: true,
        payment_status: true,
        payment_type: true,
        departure_time: true,
        discount: true,
        invoice_num: true,
        received_amount: true,
        remaining_amount: true,
        gst_status: true,
        perdayprice: true,
        guestmaster: true,
        vendor: true,
      },
    });

    rooms = rooms.map((room) => {
      room.bookingStatus = "AVAILABLE";

      reservations.forEach((reserv) => {
        if (reserv?.room_id === room?.id) {
          room.bookingStatus = "UNAVAILABLE";
          room.reservation = {
            ...reserv,
            guest: reserv?.guestmaster || {},
          };
          delete room?.reservation?.guestmaster;
          return;
        }
      });

      return {
        ...room,
        images: room?.images ? room?.images?.split(",") : [],
        facilities: room?.facilities ? room?.facilities?.split(",") : [],
      };
    });

    res
      .status(200)
      .json({status: true, message: "data fetched successfully", rooms});
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//extended checkout
const extendcheckout = async (req, res, next) => {
  try {
    let reservationId = +(await req.params.id);
    let roomId = +(await req.params.roomid);
    let {check_in, check_out} = req.body;

    // Convert input times to UTC
    check_in = new Date(check_in).toISOString();
    check_out = new Date(check_out).toISOString();

    const count = await prisma.reservationmaster.count();

    if (count === 0) {
      return res.status(200).json({status: true, message: "Data not found"});
    }

    const result = await prisma.reservationmaster.findMany({
      where: {
        NOT: {
          id: reservationId,
        },
        AND: [
          {
            room_id: roomId,
          },
          {
            check_in: {
              lt: check_out,
            },
          },
          {
            check_out: {
              gt: check_in,
            },
          },
          {
            status: "BOOKED",
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (result.length > 0) {
      return res.status(200).json({
        status: false,
        message: "Room is already booked for the entered dates",
      });
    } else {
      return res.status(200).json({
        status: true,
        message: "Room is available for the entered dates",
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//available rooms
const availablerooms = async (req, res, next) => {
  try {
    let roomId = +(await req.params.roomid);
    let {check_in, check_out} = req.body;

    // Convert input times to UTC
    check_in = new Date(check_in).toISOString();
    check_out = new Date(check_out).toISOString();

    const count = await prisma.reservationmaster.count();

    if (count === 0) {
      return res.status(200).json({status: true, message: "Data not found"});
    }

    const result = await prisma.reservationmaster.findMany({
      where: {
        AND: [
          {
            room_id: roomId,
          },
          {
            check_in: {
              lt: check_out,
            },
          },
          {
            check_out: {
              gt: check_in,
            },
          },
          {
            status: "BOOKED",
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (result.length > 0) {
      return res.status(200).json({
        status: false,
        message: "Room is already booked!",
      });
    } else {
      return res.status(200).json({
        status: true,
        message: "Room is available for the entered dates",
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//specefic rooms
const speceficroom = async (req, res, next) => {
  try {
    const id = +(await req.params.id);

    const count = await prisma.roommaster.count({
      where: {
        id,
      },
    });
    if (count === 0) {
      res.status(404).json({status: false, message: "data not found"});
    } else {
      const result = await prisma.roommaster.findFirst({
        where: {
          id,
        },
        orderBy: {
          id: "asc",
        },
      });

      res
        .status(200)
        .json({status: true, message: "data fetched successfully", result});
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

const editroom = async (req, res, next) => {
  try {
    const {id} = req.params;
    const data = req.body;
    let updateData = {
      ...data,
      perdayprice: +data.perdayprice,
    };

    // Fetch the current room's images
    const currentRoom = await prisma.roommaster.findUnique({
      where: {id: +id},
    });
    // Handle existing images from the database
    let currentImages = currentRoom.images ? currentRoom.images.split(",") : [];

    // Add new images from req.files to currentImages
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      uploadedImages = req.files.map((file) => file.filename);
    }

    // Handle images from req.body (comma-separated string of remaining images)
    if (data?.images) {
      let beforeDeleteImages = Array.isArray(data.images)
        ? [...data.images]
        : data.images.split(",");
      // Only keep images that are both in currentImages and beforeDeleteImages (i.e., not removed)
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
            "rooms",
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
          "rooms",
          image.trim()
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }
    updateData.images = uploadedImages.join(",");

    // Update the room details
    const result = await prisma.roommaster.update({
      where: {id: +id},
      data: updateData,
    });
    res.status(200).json({
      status: true,
      message: "Room details updated successfully",
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//delete rooms
const deleteroom = async (req, res, next) => {
  try {
    const id = +(await req.params.id);
    const result = await prisma.roommaster.delete({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });
    res
      .status(200)
      .json({status: true, message: "room deleted successfully", result});
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

// view rooms by filter:
//available
const getBookedRoomsForService = async (req, res, next) => {
  try {
    let result = await prisma.reservationmaster.findMany({
      where: {
        AND: {
          check_in: {
            lte: new Date(req.body.order_date),
          },
          check_out: {
            gte: new Date(req.body.order_date),
          },
          status: "BOOKED",
        },
      },
      select: {
        roommaster: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        check_in: "desc",
      },
    });

    if (result.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No rooms booked for given order date",
      });
    }

    //FILTERING ONLY UNIQUE OBJECTS BY ID
    result = result.map((item) => {
      return {...item.roommaster};
    });
    result = Array.from(
      new Map(result.map((item) => [item.id, item])).values()
    );

    res
      .status(200)
      .json({status: true, message: "data fetched successfully", result});
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//canceled
const canceledrooms = async (req, res, next) => {
  try {
    const count = await prisma.roommaster.count();

    if (count === 0) {
      res.status(404).json({status: false, message: "data not found"});
    } else {
      const result = await prisma.roommaster.findMany({
        where: {
          status: "Cancel",
        },
        orderBy: {
          id: "asc",
        },
      });
      res
        .status(200)
        .json({status: true, message: "data fetched successfully", result});
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

const checkRoomNoExists = async (req, res, next) => {
  try {
    const data = req.body;

    // Check if room number exists in the database
    const existingRoomNum = await prisma.roommaster.findFirst({
      where: {
        title: data.title,
      },
    });

    if (existingRoomNum) {
      // If room number exists, check if it's the same ID
      if (existingRoomNum.id === data.room_id) {
        return res.status(200).json({
          status: true,
          message: "This room number already exists with the same ID!",
        });
      } else {
        // If room number exists but with a different ID
        return res.status(400).json({
          status: false,
          message: "This room number already exists with a different ID!",
        });
      }
    } else {
      // If room number does not exist
      return res.status(200).json({
        status: true,
        message: "This room number is available!",
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//add rooms by excel
const addroombyexcel = async (req, res) => {
  try {
    // Ensure req.file is defined
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "No file uploaded",
      });
    }

    // Read the uploaded Excel file
    const workbook = xlsx.read(req.file.buffer, {type: "buffer"});
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert the worksheet to JSON
    const data = xlsx.utils.sheet_to_json(worksheet, {raw: false});

    // Iterate over each row in the JSON data and insert into the database
    const promises = data.map(async (item) => {
      try {
        item.perdayprice = +item.perdayprice;

        // Check if title already exists in database
        const existingRoom = await prisma.roommaster.findFirst({
          where: {
            title: item.title,
          },
        });

        if (existingRoom) {
          return false;
        }

        // Room number doesn't exist, proceed with insertion
        await prisma.roommaster.create({
          data: item,
        });

        return true; // Returning true to indicate successful insertion
      } catch (error) {
        logger.error(error);
        return false;
      }
    });

    // Wait for all insert operations to complete
    const results = await Promise.all(promises);

    // Check if any room number already existed
    if (results.includes(false)) {
      return res.status(400).json({
        status: false,
        message: "Some room numbers already exist in the database.",
      });
    }

    // Send success response if all insertions were successful
    res.status(200).json({
      status: true,
      message: "Rooms inserted successfully!",
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

module.exports = {
  addrooms,
  allrooms,
  speceficroom,
  editroom,
  deleteroom,
  getBookedRoomsForService,
  canceledrooms,
  checkRoomNoExists,
  addroombyexcel,
  changeRoomDisabled,
  extendcheckout,
  availablerooms,
};
