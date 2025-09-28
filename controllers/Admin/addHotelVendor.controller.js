const {prisma} = require("../../models/connection");
const logger = require("../../utils/logger");
const bcrypt = require("bcrypt");

// Add vendor by Admin
const addVendor = async (req, res) => {
  try {
    const {email, password, fullName, phoneNumber} = req.body;
    const isExists = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });
    if (isExists) {
      return res
        .status(422)
        .json({status: false, message: "User already exists with this email."});
    }

    const role = await prisma.rolemaster.findFirst({
      where: {role: "Vendor"},
    });
    const hashedPassword = await bcrypt.hash(password, 10);
    const data = {
      role_id: role.id,
      email: email,
      password: hashedPassword,
      fullname: fullName,
      phone_number: phoneNumber,
    };
    const result = await prisma.users.create({
      data,
      select: {id: true},
    });
    res
      .status(200)
      .json({status: true, message: "Vendor added successfully!", result});
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};
module.exports = {addVendor};
