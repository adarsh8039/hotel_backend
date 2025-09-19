const { prisma } = require("../../models/connection");
const logger = require("../../utils/logger");
const xlsx = require("xlsx");

const allCompanies = async (req, res, next) => {
  try {
    const count = await prisma.company_master.count();

    if (count === 0) {
      res.status(404).json({ status: false, message: "data not found" });
    } else {
      const result = await prisma.company_master.findMany({
        where:{
          NOT:{
            status: false,
          }
        },
        orderBy: {
          id: "desc",
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

const getCompany = async (req, res, next) => {
  try {
    const id = +(await req.params.id);
    const count = await prisma.company_master.count({
      where: {
        id,
      },
    });
    if (count === 0) {
      res.status(404).json({ status: false, message: "data not found" });
    } else {
      const result = await prisma.company_master.findFirst({
        where: {
          id,
        },
        orderBy: {
          id: "desc",
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

const addCompany = async (req, res, next) => {
  try {
    data = await req.body;

         // Check if gst number already exists in the databse
         const existinggst = await prisma.company_master.findFirst({
          where: {
              company_gst: data.company_gst,
          },
      });

      if (existinggst) {
          return res.status(500).json({ status: false, message: 'GST number already exists!' });
      }

    const result = await prisma.company_master.create({
      data,
      select: {
        id: true,
      },
    });

    res.status(200).json({
      status: true,
      message: "Company inserted successfully!",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

const editCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    data = await req.body;

    const result = await prisma.company_master.update({
      data,
      where: {
        id: +id,
      },
      select: {
        id: true,
      },
    });
    res.status(200).json({
      status: true,
      message: "Company data updated successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

const disablecompany = async (req, res, next) => {
  try {
    const id = +(await req.params.id);
    const result = await prisma.company_master.update({
      data:{
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
      .json({ status: true, message: "Company deleted successfully", result });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//add company by excel
const addCompanybyexcel = async (req, res) => {
  try {
    // Ensure req.file is defined
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "No file uploaded",
      });
    }

    // Read the uploaded Excel file
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert the worksheet to JSON
    const data = xlsx.utils.sheet_to_json(worksheet, { raw: false });

    // Iterate over each row in the JSON data and insert into the database
    const promises = data.map(async (item) => {
      await prisma.company_master.create({
        data: item,
      });
    });

    // Wait for all insert operations to complete
    await Promise.all(promises);
    // Send success response
    res.status(200).json({
      status: true,
      message: "Company inserted successfully!",
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//all company by date
const allCompaniesbydate = async (req, res, next) => {
  try {
    let {from, to} = req.body
    from = new Date(from);
    to = new Date(to);
    const count = await prisma.company_master.count();

    if (count === 0) {
      res.status(404).json({ status: false, message: "data not found" });
    } else {
      const result = await prisma.company_master.findMany({
        where:{
          AND:{
            created_at:{
              gte: from,
              lte: to,
            }
          },
          NOT:{
            status: false,
          }
        },
        orderBy: {
          id: "desc",
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

//check gst exist or not
const gstnumber = async (req,res,next)=>{
  try {
    let data = req.body;

        const existinggst = await prisma.company_master.findFirst({
          where: {
              company_gst: data.company_gst,
          },
      });
      if (existinggst) {
          return res.status(500).json({ status: false, message: 'GST number already exists!' });
      }
      res.status(200).json({status: true, message: "Gst number not exist"})
  } catch (error) {
    console.log(error)
    res.status(500).json({status: false, message: "Internal server error"})
  }
}

module.exports = {
  allCompanies,
  getCompany,
  addCompany,
  editCompany,
  disablecompany,
  addCompanybyexcel,
  allCompaniesbydate,
  gstnumber
};
