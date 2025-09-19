const { prisma } = require("../../models/connection");
const logger = require("../../utils/logger");
const xlsx = require('xlsx');
const NodeCache = require("node-cache");
const myCache = new NodeCache(); 

const getAllCategories = async (req, res, next) => {
  try {
    const cacheKey = "Category";
    const cachedData = myCache.get(cacheKey);

    if (cachedData) {
      return res
        .status(200)
        .json({ status: true, message: "Cache data fetched successfully", result: cachedData });
    }

    // Fetch data from database
    const result = await prisma.food_category_master.findMany({
      orderBy: { id: "asc" },
    });

    myCache.set(cacheKey, result); 

    res.status(200).json({ 
      status: true, 
      message: "Data fetched successfully", 
      result 
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ 
      status: false, 
      message: error.message 
    });
  }
};

const getCategory = async (req, res, next) => {
  try {
    const id = +(await req.params.id);
    const count = await prisma.food_category_master.count({
      where: {
        id,
      },
    });
    if (count === 0) {
      res.status(404).json({ status: false, message: "data not found" });
    } else {
      const result = await prisma.food_category_master.findFirst({
        where: {
          id,
        },
        orderBy: {
          id: "asc",
        },
      });
      res
        .status(200)
        .json({ status: true, message: "data fetched successfully", result });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

// add food category
const addCategory = async (req, res, next) => {
  try {
    data = await req.body;
    const result = await prisma.food_category_master.create({
      data,
    });
    myCache.del("Category"); // Invalidate the cache
    res.status(200).json({
      status: true,
      message: "Category inserted successfully!",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

const editCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const result = await prisma.food_category_master.update({
      where: { id: +id },
      data,
    });
    myCache.del("Category"); // Invalidate the cache
    res.status(200).json({ 
      status: true, 
      message: "Category updated successfully", 
      result 
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ 
      status: false, 
      message: error.message 
    });
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const id = +(await req.params.id);
    const result = await prisma.food_category_master.delete({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });
     // Get cache from app
     const myCache = req.app.get('cache');

     // Invalidate the cache for all food items
     const allCategoryCacheKey = 'Category';
     myCache.del(allCategoryCacheKey);
    res
      .status(200)
      .json({ status: true, message: "Category data deleted successfully", result });
    } catch (error) {
      logger.error(error);
      res.status(500).json({ status: false, message: error.message });
    }
};

// add category by excel
const addCategorybyexcel = async (req, res) => {
  try {
    // Ensure req.file is defined
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: 'No file uploaded',
      });
    }

    // Read the uploaded Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert the worksheet to JSON
    const data = xlsx.utils.sheet_to_json(worksheet, { raw: false });

    // Iterate over each row in the JSON data and insert into the database
    const promises = data.map(async (item) => {
      await prisma.food_category_master.create({
        data: item,
      });
    });

    // Wait for all insert operations to complete
    await Promise.all(promises);
    const myCache = req.app.get("cache");
    myCache.del("Categories");
    // Send success response
    res.status(200).json({
      status: true,
      message: 'Category inserted successfully!',
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

module.exports = {
  getAllCategories,
  getCategory,
  addCategory,
  editCategory,
  deleteCategory,
  addCategorybyexcel
};
