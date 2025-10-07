const {prisma} = require("../../models/connection");
const xlsx = require("xlsx");
const logger = require("../../utils/logger");
const NodeCache = require("node-cache");
const myCache = new NodeCache();

const getAllexpenses = async (req, res, next) => {
  try {
    const {userDetails} = req.headers;
    const count = await prisma.expenses_master.count({
      where: {user_id: userDetails.id},
    });

    if (count === 0) {
      res.status(404).json({status: false, message: "data not found"});
    } else {
      const result = await prisma.expenses_master.findMany({
        where: {
          user_id: userDetails.id,
          NOT: {
            status: false,
          },
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

const getexpense = async (req, res, next) => {
  try {
    const id = +(await req.params.id);
    const count = await prisma.expenses_master.count({
      where: {
        id,
      },
    });
    if (count === 0) {
      res.status(404).json({status: false, message: "data not found"});
    } else {
      const result = await prisma.expenses_master.findFirst({
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

const addexpenses = async (req, res, next) => {
  try {
    const {userDetails} = req.headers;
    data = await req.body;
    data.date - new Date(req.body.date);
    data.user_id = userDetails.id;

    const result = await prisma.expenses_master.create({
      data: {
        ...data,
      },
      select: {
        id: true,
      },
    });
    myCache.del("Expenses"); // Invalidate the cache
    res.status(200).json({
      status: true,
      message: "Expense inserted successfully!",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

const editexpense = async (req, res, next) => {
  try {
    const {id} = req.params;
    let date = new Date(req.body.date);

    const result = await prisma.expenses_master.update({
      data: {
        date: date,
        description: req.body.description,
        amount: req.body.amount,
      },
      where: {
        id: +id,
      },
      select: {
        id: true,
      },
    });
    myCache.del("Expenses"); // Invalidate the cache
    res
      .status(200)
      .json({status: true, message: "Expense updated successfully", result});
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

const disableexpenses = async (req, res, next) => {
  try {
    const id = +(await req.params.id);
    const result = await prisma.expenses_master.update({
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
    myCache.del("Expenses"); // Invalidate the cache
    res
      .status(200)
      .json({status: true, message: "Expense deleted successfully", result});
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//add expenses by excel
const addexpensesbyexcel = async (req, res) => {
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

    // Helper function to convert date to ISO format
    const convertToISODate = (dateStr) => {
      const [day, month, year] = dateStr.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}T00:00:00.000Z`;
    };

    // Iterate over each row in the JSON data and format dates and amounts
    const formattedData = data.map((item) => {
      const formattedItem = {...item};
      if (formattedItem.date) {
        formattedItem.date = convertToISODate(formattedItem.date);
      }
      if (formattedItem.amount) {
        formattedItem.amount = parseFloat(formattedItem.amount);
      }
      return formattedItem;
    });

    // Insert formatted data into the database
    const promises = formattedData.map(async (item) => {
      await prisma.expenses_master.create({
        data: item,
      });
    });

    // Wait for all insert operations to complete
    await Promise.all(promises);

    const myCache = req.app.get("cache");
    myCache.del("Expenses");
    // Send success response
    res.status(200).json({
      status: true,
      message: "Expenses inserted successfully!",
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//expenses by date
const getAllexpensesbydate = async (req, res, next) => {
  let {from, to} = req.body;
  from = new Date(from);
  to = new Date(to);
  try {
    const count = await prisma.expenses_master.count();

    if (count === 0) {
      res.status(404).json({status: false, message: "data not found"});
    } else {
      const result = await prisma.expenses_master.findMany({
        where: {
          AND: [
            {
              date: {
                gte: from,
                lte: to,
              },
            },
          ],
          NOT: {
            status: false,
          },
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

module.exports = {
  getAllexpenses,
  getexpense,
  addexpenses,
  editexpense,
  disableexpenses,
  addexpensesbyexcel,
  getAllexpensesbydate,
};
