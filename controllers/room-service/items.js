const { prisma } = require("../../models/connection");
const logger = require("../../utils/logger");
const { startOfWeek, endOfWeek } = require("date-fns");

//view room service
const getServiceItemsByServiceId = async (req, res, next) => {
  try {
    let service_id = +(await req.params.id);

    //get cache from app
    const myCache = req.app.get('cache');
    const cacheKey = 'serviceitembyid';

    //get cache data
    const cachedData = myCache.get(cacheKey);
    if(cachedData){
     return res.status(200).json({status: true, message: 'Cached data fetched successfully', result: cachedData})
    }

    //if no cached data found

    const count = await prisma.room_service_item_master.count({
      where: {
        service_id: service_id,
      },
    });

    if (count === 0) {
      res.status(404).json({ status: false, message: "data not found" });
    } else {
      const result = await prisma.room_service_item_master.findMany({
        orderBy: {
          id: "asc",
        },
        where: {
          service_id: service_id,
        },
        include: {
          fooditemmaster: true,
          roomservicemaster: true,
        },
      });
      myCache.set(cacheKey, result); 
      res
        .status(200)
        .json({ status: true, message: "data fetched successfully", result });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//edit roomservice
const editServiceItems = async (req, res, next) => {
  try {
    const service_item_id = +(await req.params.id);
    data = await req.body;

    const result = await prisma.room_service_item_master.update({
      data: data,
      where: {
        id: service_item_id,
      },
    });
    res.status(200).json({
      status: true,
      message: "room-service updated successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//delete room service
const deleteServiceItems = async (req, res, next) => {
  try {
    const service_item_id = +(await req.params.id);

    const result = await prisma.room_service_item_master.delete({
      where: {
        id: service_item_id,
      },
    });

    res.status(200).json({
      status: true,
      message: "service-item deleted successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

module.exports = {
  getServiceItemsByServiceId,
  editServiceItems,
  deleteServiceItems,
};
