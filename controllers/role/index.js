const { prisma } = require('../../models/connection');
const logger = require("../../utils/logger");

const getAllroles = async (req, res, next) => {
  try {
    const count = await prisma.rolemaster.count();

    if (count === 0) {
      res.status(404).json({ status: false, message: 'data not found' });
    } else {
      const result = await prisma.rolemaster.findMany({
        orderBy: {
          id: 'asc',
        },
      });
      res.status(200).json({ status: true, message: 'data fetched successfully', result });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

const getrole = async (req, res, next) => {
  try {
    const id = +(await req.params.id);
    const count = await prisma.rolemaster.count({
      where: {
        id,
      },
    });
    if (count === 0) {
      res.status(404).json({ status: false, message: 'data not found' });
    } else {
      const result = await prisma.rolemaster.findFirst({
        where: {
          id,
        },
        orderBy: {
          id: 'asc',
        },
      });
      res.status(200).json({ status: true, message: 'data fetched successfully', result });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

const addrole = async (req, res, next) => {
  try {
    data = await req.body;

    const result = await prisma.rolemaster.create({
      data,
      select: {
        id: true,
      },
    });

    res.status(200).json({ status: true, message: 'Role inserted successfully!', result });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

const editrole = async (req, res, next) => {
  try {
    const { id } = req.params;
    data = await req.body;

    const result = await prisma.rolemaster.update({
      data,
      where: {
        id: +(id),
      },
      select: {
        id: true,
      },
    });
    res.status(200).json({ status: true, message: 'role updated successfully', result });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

const deleterole = async (req, res, next) => {
  try {
    const id = +(await req.params.id);
    const result = await prisma.rolemaster.delete({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });
    res.status(200).json({ status: true, message: 'role deleted successfully', result });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

module.exports = {
  getAllroles, getrole, addrole, editrole, deleterole,
};
