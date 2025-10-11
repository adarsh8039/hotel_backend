const {exist} = require("joi");
const {prisma} = require("../../models/connection");
const imagePath = "https://api.hotel.msquaretec.com";
const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const logger = require("../../utils/logger");
const NodeCache = require("node-cache");
const myCache = new NodeCache();

//add food item
const addfooditem = async (req, res, next) => {
  try {
    const {userDetails} = req.headers;
    data = await req.body;
    data.price = +data.price;
    data.user_id = userDetails.id;
    const room = await prisma.fooditemmaster.create({
      data: {
        ...data,
      },
    });

    myCache.del("allfooditems"); // Invalidate the cache
    res.status(200).json({
      status: true,
      message: "Food item inserted successfully!",
      room,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

// view fooditems
const allfooditems = async (req, res, next) => {
  try {
    const {userDetails} = req.headers;
    const count = await prisma.fooditemmaster.count({
      where: {user_id: userDetails.id},
    });

    if (count === 0) {
      res.status(404).json({status: false, message: "data not found"});
    } else {
      const result = await prisma.fooditemmaster.findMany({
        orderBy: {
          item_name: "asc",
        },
        where: {
          user_id: userDetails.id,
          NOT: {
            status: false,
          },
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

//specefic food item
const speceficfooditem = async (req, res, next) => {
  try {
    const id = +(await req.params.id);
    const count = await prisma.fooditemmaster.count({
      where: {
        id,
      },
    });
    if (count === 0) {
      res.status(404).json({status: false, message: "data not found"});
    } else {
      const result = await prisma.fooditemmaster.findFirst({
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

//edit food item
const editfooditem = async (req, res, next) => {
  try {
    const {id} = req.params;
    const data = req.body;
    data.price = +data.price;

    // Fetch the current food item to get the existing image if no new image is provided
    const currentFoodItem = await prisma.fooditemmaster.findUnique({
      where: {
        id: +id,
      },
    });

    if (!currentFoodItem) {
      return res
        .status(404)
        .json({status: false, message: "Food item not found"});
    }

    // if (req.files && req.files.images && req.files.images.length > 0) {
    //   // Delete old images if they exist
    //   if (currentFoodItem.images) {
    //     const oldImages = currentFoodItem.images.split(",");
    //     oldImages.forEach(image => {
    //       const imagePath = path.join(__dirname, '..', '..', 'uploads', 'foods', image.trim());
    //       fs.unlink(imagePath, (error) => {
    //       });
    //     });
    //   }
    //   // Update with the new image
    //   data.images = req.files.images[0].filename;
    // } else {
    //   // Retain the existing image if no new image is provided or no files.images exists
    //   data.images = currentFoodItem.images || '';  // Default to empty string if no images
    // }

    const result = await prisma.fooditemmaster.update({
      data: {
        ...data,
      },
      where: {
        id: +id,
      },
    });

    myCache.del("allfooditems"); // Invalidate the cache

    res.status(200).json({
      status: true,
      message: "Food item details updated successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//check food code exists or not
const checkItemCodeExists = async (req, res, next) => {
  try {
    const data = req.body;

    // Check if item code exists in the database
    const existingCodeItem = await prisma.fooditemmaster.findFirst({
      where: {
        item_code: data.item_code,
      },
    });

    if (existingCodeItem) {
      // If item code exists, check if it's the same ID
      if (existingCodeItem.id === data.item_id) {
        return res.status(200).json({
          status: true,
          message: "This food code already exists with the same ID!",
        });
      } else {
        // If item code exists but with a different ID
        return res.status(400).json({
          status: false,
          message: "This food code already exists with a different ID!",
        });
      }
    } else {
      // If item code does not exist
      return res.status(200).json({
        status: true,
        message: "This food code is available!",
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//delete food item
const disablefooditem = async (req, res, next) => {
  try {
    const id = +(await req.params.id);
    const result = await prisma.fooditemmaster.update({
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
    res.status(200).json({
      status: true,
      message: "food-item deleted successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//add food item by excel
const addfooditembyexcel = async (req, res) => {
  try {
    const {userDetails} = req.headers;
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "No file uploaded",
      });
    }

    const workbook = xlsx.read(req.file.buffer, {type: "buffer"});
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, {raw: false});
    const foodItems = [];
    const duplicateItemCodes = [];

    for (const item of data) {
      //   const categoryId = parseInt(item.category_id, 10);

      //   const category = await prisma.food_category_master.findUnique({
      //     where: { id: categoryId },
      //   });

      //   if (!category) {
      //     return res.status(400).json({
      //       status: false,
      //       message: `No entry found in category table for id: ${categoryId}`,
      //     });
      //   }

      // Check if item_code already exists
      // const existingItem = await prisma.fooditemmaster.findFirst({
      //   where: { item_code: item.item_code },
      // });

      // if (existingItem) {
      //   duplicateItemCodes.push(item.item_code);
      // }

      foodItems.push({
        item_name: item?.item_name,
        // item_code: item?.item_code,
        // images: null,
        price: parseFloat(item?.price),
        user_id: userDetails.id,
        // tax_type: item?.tax_type,
        // category_id: categoryId,
      });
    }

    // If duplicate item codes found, return false
    // if (duplicateItemCodes.length > 0) {
    //   return res.status(400).json({
    //     status: false,
    //     message: `Duplicate item codes found: ${duplicateItemCodes.join(', ')}`,
    //   });
    // }

    await prisma.$transaction(async (prisma) => {
      for (const foodItem of foodItems) {
        await prisma.fooditemmaster.create({
          data: foodItem,
        });
      }
    });

    res.status(200).json({
      status: true,
      message: "Food items inserted successfully!",
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

module.exports = {
  addfooditem,
  allfooditems,
  speceficfooditem,
  editfooditem,
  disablefooditem,
  checkItemCodeExists,
  addfooditembyexcel,
};
