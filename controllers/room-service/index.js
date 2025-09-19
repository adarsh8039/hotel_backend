const { prisma } = require("../../models/connection");
const logger = require("../../utils/logger");
const handleImageUpload = require("../../middlewares/upload");
const { startOfWeek, endOfWeek } = require("date-fns");
const { secretmanager } = require("googleapis/build/src/apis/secretmanager");
const { default: id } = require("date-and-time/locale/id");

// all rooms no
const roomnumbers = async (req, res, next) => {
  try {
    const order = await prisma.roomservicemaster.findMany({
      orderBy: {
        id: "asc",
      },
      select: {
        order_date: true,
      },
    });
    const room = await prisma.reservationmaster.findMany({
      where: {
        AND: {
          check_in: {
            gte: order.order_date,
          },
          check_out: {
            lte: order.order_date,
          },
        },
      },
      select: {
        room_id: true,
        roommaster: {
          select: {
            title: true,
          },
        },
      },
    });

    res.status(200).json({
      status: true,
      message: "Rooms fetched successfully!",
      order,
      room,
    });
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({ status: false, message: "Internal Server Error", error });
  }
};

// all foods
const fooditems = async (req, res, next) => {
  try {
    //get cache from app
    // const myCache = req.app.get('cache');
    // const cacheKey = 'fooditems';

    // //get cache data
    // const cachedData = myCache.get(cacheKey);
    // if(cachedData){
    //  return res.status(200).json({status: true, message: 'Cached data fetched successfully', result: cachedData})
    // }

    //if no cached data found

    const foods = await prisma.fooditemmaster.findMany({
      orderBy: {
        id: "asc",
      },
      select: {
        item_name: true,
      },
    });
    // myCache.set(cacheKey, result);
    res.status(200).json({
      status: true,
      message: "Food items fetched successfully!",
      foods,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//selected item price
const foodprice = async (req, res, next) => {
  try {
    let id = req.param.id;
    const foods = await prisma.fooditemmaster.findFirst({
      where: {
        id: id,
      },
      select: {
        item_name: true,
        price: true,
      },
    });
    res.status(200).json({
      status: true,
      message: "Food items price fetched successfully!",
      foods,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//add room service
// const roomservice = async (req, res, next) => {
//   try {
//     req.body.order_date = new Date(req.body.order_date);

//     // let reservation = await prisma.reservationmaster.findFirst({
//     //   where: {
//     //     AND: {
//     //       check_in: {
//     //         lte: req.body.order_date,
//     //       },
//     //       room_id: +req.body.room_id,
//     //     },
//     //   },
//     //   select: {
//     //     id: true,
//     //     room_id: true,
//     //     invoice_num: true,
//     //     guestmaster: {
//     //       select: {
//     //         id: true,
//     //         fullname: true,
//     //       },
//     //     },
//     //   },
//     //   orderBy: {
//     //     check_in: "desc",
//     //   },
//     // });

//     // if (!reservation || reservation == null || reservation == undefined) {
//     //   return res.status(404).json({
//     //     status: false,
//     //     message: "No reservation found for this room taday.",
//     //   });
//     // }

//     req.body.booking_date = new Date(req.body.booking_date);
//     req.body.check_in = new Date(req.body.check_in);
//     req.body.check_out = new Date(req.body.check_out);

//     // const images = req.file ? `${req.file.filename}` : req.body.document_images;

//     // Fetch the last invoice number
//     const lastInvoice = await prisma.roomservicemaster.findFirst({
//       select: {
//         invoice_num: true,
//       },
//       orderBy: {
//         invoice_num: "desc",
//       },
//     });

//     let nextInvoiceNum = lastInvoice ? lastInvoice.invoice_num + 1 : 1;

//     const service = await prisma.roomservicemaster.create({
//       data: {
//         // reservation_id: +reservation.id,
//         order_date: req.body.order_date,
//         sub_total: req.body.sub_total,
//         // cgst: req.body.cgst,
//         // sgst: req.body.sgst,
//         // igst: req.body.igst,
//         concession: req.body.concession,
//         total: req.body.total,
//         invoice_num: nextInvoiceNum,
//         payment_status: "UNPAID",
//         name: req.body.name,
//         mobile_no: req.body.mobile_no,
//       },
//     });

//     await req.body.service_items.forEach((item) => {
//       item.service_id = service.id;
//     });

//     let service_items = await prisma.room_service_item_master.createMany({
//       data: req.body.service_items,
//     });

//     const myCache = req.app.get("cache");
//     myCache.del("viewroomservice");

//     res.status(200).json({
//       status: true,
//       message: "Room service registered!",
//       service,
//       service_items,
//     });
//   } catch (error) {
//     logger.error(error);
//     res.status(500).json({ status: false, message: "Internal Server Error" });
//   }
// };

const roomservice = async (req, res, next) => {
  const prisma = req.app.get("prisma");
  try {
    // Parse date fields
    req.body.order_date = new Date(req.body.order_date);
    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      let nextInvoiceNum = req.body.invoice_num;

      // Generate next invoice number if not provided
      if (!nextInvoiceNum) {
        const lastInvoice = await tx.roomservicemaster.findFirst({
          select: {
            invoice_num: true,
          },
          orderBy: {
            invoice_num: "desc",
          },
        });

        nextInvoiceNum = lastInvoice ? lastInvoice.invoice_num + 1 : 1;
      }
      console.log("Data: ", req.body);
      let guest;
      // Check if user_id is provided
      if (req.body.user_id) {
        guest = await tx.guestmaster.findUnique({
          where: { id: req.body.user_id },
          select: { id: true },
        });

        if (!guest) {
          guest = await tx.guestmaster.create({
            data: {
              fullname: req.body.fullname,
              phone_number: req.body.phone_number,
            },
            select: { id: true },
          });
        }
      }

      // Create room service master record
      const service = await tx.roomservicemaster.create({
        data: {
          order_date: req.body.order_date,
          sub_total: req.body.sub_total,
          concession: req.body.concession,
          total: req.body.total,
          invoice_num: nextInvoiceNum,
          payment_status: "UNPAID",
          fullname: req.body.fullname,
          phone_number: req.body.phone_number,
          check_in: req.body.check_in,
          check_out: req.body.check_out,
        },
      });

      // Process service items
      const serviceItems = req.body.service_items;
      const processedItems = [];

      for (let item of serviceItems) {
        let foodItem = await tx.fooditemmaster.findUnique({
          where: { id: +item.item_id },
          select: { id: true },
        });

        if (!foodItem) {
          foodItem = await tx.fooditemmaster.create({
            data: {
              item_name: item.item_name,
              price: item.price,
            },
            select: { id: true },
          });
        }

        processedItems.push({
          service_id: service.id,
          item_id: foodItem.id,
          quantity: item.quantity,
          price: item.price,
          total: +item.total,
          discount: null,
        });
      }

      // Create room service item master records
      await tx.room_service_item_master.createMany({
        data: processedItems,
      });

      return { service, processedItems };
    });

    const myCache = req.app.get("cache");
    myCache.del("viewroomservice");

    res.status(200).json({
      status: true,
      message: "Room service registered!",
      service: result.service,
      service_items: result.processedItems,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//view room service
const viewroomservice = async (req, res, next) => {
  try {
    const result = await prisma.roomservicemaster.findMany({
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
        order_date: true,
        fullname: true,
        phone_number: true,
        concession: true,
        total: true,
        invoice_num: true,
        payment_status: true,
        check_in: true,
        check_out: true,
        room_service_item_master: {
          include: {
            fooditemmaster: {
              select: {
                item_name: true,
              },
            },
          },
        },
      },
    });

    if (result.length === 0) {
      return res.status(404).json({ status: false, message: "data not found" });
    }

    result?.forEach((el) => {
      el?.room_service_item_master?.forEach((item) => {
        item.item_code = item?.fooditemmaster?.item_code;
        item.item_name = item?.fooditemmaster?.item_name;
        delete item.fooditemmaster;
      });
      el.room_service_items = el?.room_service_item_master;
      delete el?.room_service_item_master;
    });

    // Send the response with the flattened data
    res.status(200).json({
      status: true,
      message: "data fetched successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//view room service by id
const viewroomservicebyid = async (req, res, next) => {
  try {
    let service_id = +(await req.params.id);

    const count = await prisma.roomservicemaster.count({
      where: {
        id: service_id,
      },
    });

    if (count === 0) {
      res.status(404).json({ status: false, message: "data not found" });
    } else {
      const result = await prisma.roomservicemaster.findFirst({
        orderBy: {
          id: "asc",
        },
        include: {
          room_service_item_master: {
            select: {
              id: true,
              quantity: true,
              price: true,
              total: true,
              item_id: true,
              service_id: true,
              fooditemmaster: {
                select: {
                  item_name: true,
                },
              },
            },
          },
        },
        where: {
          id: service_id,
        },
      });

      result?.room_service_item_master?.forEach((item) => {
        item.item_code = item?.fooditemmaster?.item_code;
        item.item_name = item?.fooditemmaster?.item_name;
        delete item.fooditemmaster;
      });
      result.field = result?.room_service_item_master;
      delete result?.room_service_item_master;

      // myCache.set(cacheKey, result);
      res.status(200).json({
        status: true,
        message: "data fetched successfully",
        result,
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//edit roomservice
const editroomservice = async (req, res, next) => {
  try {
    const service_id = parseInt(req.params.id, 10); // Explicitly convert to integer
    const { service_items, order_date, ...values } = req.body;

    // Convert order_date to a Date object
    const formattedOrderDate = new Date(order_date);

    // Update or create service items
    await Promise.all(
      service_items.map(async (item) => {
        let { id, item_id, item_name, price, ...itemData } = item;

        // If no item_id exists, create a new entry in fooditemmaster
        if (!item_id) {
          const newItem = await prisma.fooditemmaster.create({
            data: {
              item_name, // Use item_name from service_items
              price, // Use price from service_items
            },
            select: { id: true },
          });
          item_id = newItem.id; // Assign the new item_id
        }

        if (id === 0) {
          // Create new service item
          await prisma.room_service_item_master.create({
            data: {
              service_id,
              item_id,
              quantity: itemData.quantity,
              price,
              cgst: itemData.cgst,
              sgst: itemData.sgst,
              igst: itemData.igst,
              total: parseFloat(itemData.total),
            },
          });
        } else {
          // Update existing service item
          await prisma.room_service_item_master.update({
            data: {
              service_id,
              item_id,
              quantity: itemData.quantity,
              price,
              cgst: itemData.cgst,
              sgst: itemData.sgst,
              igst: itemData.igst,
              total: parseFloat(itemData.total),
            },
            where: { id: parseInt(id, 10) },
          });
        }
      })
    );

    // Update room service master
    const result = await prisma.roomservicemaster.update({
      data: {
        ...values,
        order_date: formattedOrderDate,
      },
      where: { id: service_id },
      select: { id: true },
    });

    const myCache = req.app.get("cache");
    myCache.del("viewroomservice");
    res.status(200).json({
      status: true,
      message: "Room service updated successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//roomservice status update
const editRoomServiceStatusPaid = async (req, res, next) => {
  try {
    const service_id = +(await req.params.id);

    let roomservice = await prisma.roomservicemaster.count({
      where: {
        id: service_id,
      },
    });

    if (roomservice === 0) {
      return res.status(404).json({
        status: false,
        message: "No data found",
      });
    }

    const result = await prisma.roomservicemaster.update({
      data: {
        payment_status: "PAID",
      },
      where: {
        id: service_id,
      },
      select: {
        id: true,
      },
    });

    const myCache = req.app.get("cache");
    myCache.del("viewroomservice");
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
const deleteroomservice = async (req, res, next) => {
  try {
    const id = +req.params.id;
    // Find the associated room service items
    const items = await prisma.room_service_item_master.findMany({
      where: {
        service_id: id,
      },
      select: {
        id: true,
      },
    });

    // Extract item IDs
    const itemIds = items.map((item) => item.id);

    // Delete the associated room service items if they exist
    if (itemIds.length > 0) {
      await prisma.room_service_item_master.deleteMany({
        where: {
          id: {
            in: itemIds,
          },
        },
      });
    }

    // Delete the room service entry
    const data = await prisma.roomservicemaster.delete({
      where: {
        id: id,
      },
      select: {
        id: true,
      },
    });

    const myCache = req.app.get("cache");
    myCache.del("viewroomservice");

    res.status(200).json({
      status: true,
      message: "Room service and associated items deleted successfully",
      deletedRoomService: data,
      deletedItems: items,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//previous day room-services
const previousdayroomservices = async (req, res, next) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0); // Start of the day
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const count = await prisma.roomservicemaster.count({
      where: {
        order_date: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    if (count === 0) {
      res.status(404).json({ status: false, message: "data not found" });
    } else {
      const result = await prisma.roomservicemaster.findMany({
        where: {
          order_date: {
            gte: yesterday,
            lt: today,
          },
        },
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          order_date: true,
          sub_total: true,
          cgst: true,
          sgst: true,
          igst: true,
          concession: true,
          total: true,
          reservationmaster: {
            select: {
              roommaster: {
                select: {
                  id: true,
                  title: true,
                },
              },
              guestmaster: {
                select: {
                  fullname: true,
                  phone_number: true,
                  email: true,
                },
              },
            },
          },
          room_service_item_master: {
            include: {
              fooditemmaster: {
                select: {
                  item_code: true,
                  item_name: true,
                  images: true,
                  tax_type: true,
                },
              },
            },
          },
        },
      });

      result.forEach((item) => {
        item.room_id = item?.reservationmaster?.roommaster?.id;
        item.title = item?.reservationmaster?.roommaster?.title;
        item.email = item?.reservationmaster?.guestmaster?.email;
        item.fullname = item?.reservationmaster?.guestmaster?.fullname;
        item.phone_number = item?.reservationmaster?.guestmaster?.phone_number;
        item.room_service_items = item?.room_service_item_master?.map((ele) => {
          let { fooditemmaster, ...val } = ele;
          return { ...val, ...fooditemmaster };
        });
        delete item.reservationmaster;
        delete item.room_service_item_master;
      });

      // const foodIds = result.map((item) => item.item_id);
      // const roomIds = result.map((item) => item.room_id);

      // const food = await prisma.fooditemmaster.findMany({
      //   where: {
      //     id: { in: foodIds },
      //   },
      //   select: {
      //     item_code: true,
      //     item_name: true,
      //     images: true,
      //   },
      // });

      // const room = await prisma.roommaster.findMany({
      //   where: {
      //     id: { in: roomIds },
      //   },
      //   select: {
      //     title: true,
      //     images: true,
      //   },
      // });

      res.status(200).json({
        status: true,
        message: "data fetched successfully",
        result,
        // room,
        // food,
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//this month room-service
const monthlyroomservice = async (req, res, next) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const count = await prisma.roomservicemaster.count({
      where: {
        order_date: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    if (count === 0) {
      res.status(404).json({ status: false, message: "Data not found" });
    } else {
      const result = await prisma.roomservicemaster.findMany({
        where: {
          order_date: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
        },
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          order_date: true,
          sub_total: true,
          cgst: true,
          sgst: true,
          igst: true,
          discount: true,
          total: true,
          reservationmaster: {
            select: {
              roommaster: {
                select: {
                  id: true,
                  title: true,
                },
              },
              guestmaster: {
                select: {
                  fullname: true,
                  phone_number: true,
                  email: true,
                },
              },
            },
          },
          room_service_item_master: {
            include: {
              fooditemmaster: {
                select: {
                  item_code: true,
                  item_name: true,
                  images: true,
                  tax_type: true,
                },
              },
            },
          },
        },
      });

      result.forEach((item) => {
        item.room_id = item?.reservationmaster?.roommaster?.id;
        item.title = item?.reservationmaster?.roommaster?.title;
        item.email = item?.reservationmaster?.guestmaster?.email;
        item.fullname = item?.reservationmaster?.guestmaster?.fullname;
        item.phone_number = item?.reservationmaster?.guestmaster?.phone_number;
        item.room_service_items = item?.room_service_item_master?.map((ele) => {
          let { fooditemmaster, ...val } = ele;
          return { ...val, ...fooditemmaster };
        });
        delete item.reservationmaster;
        delete item.room_service_item_master;
      });

      // //EXTRACT FOOD ID'S FROM ARRAY OF OBJECTS AND THEN FLAPMAPPING THE ARRAY TO GET ONLY UNIQUE ID'S
      // let foodIds = result
      //   .map((item) => {
      //     let id = item.room_service_item_master.map((ele) => ele.item_id);
      //     return id;
      //   })
      //   .flatMap((i) => i);

      // //CONVERTING SET INTO ARRAY
      // foodIds = [...new Set(foodIds)];
      // const roomIds = [...new Set(result.map((r) => r.room_id))];

      // const food = await prisma.fooditemmaster.findMany({
      //   where: {
      //     id: { in: foodIds },
      //   },
      //   select: {
      //     item_code: true,
      //     item_name: true,
      //     images: true,
      //   },
      // });

      // const room = await prisma.roommaster.findMany({
      //   where: {
      //     id: { in: roomIds },
      //   },
      //   select: {
      //     title: true,
      //     images: true,
      //   },
      // });

      res.status(200).json({
        status: true,
        message: "Data fetched successfully",
        result,
        // room,
        // food,
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//this week
const weeklyroomservice = async (req, res, next) => {
  try {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 }); // Assuming the week starts on Monday
    const end = endOfWeek(now, { weekStartsOn: 1 });

    const count = await prisma.roomservicemaster.count({
      where: {
        order_date: {
          gte: start,
          lte: end,
        },
      },
    });

    if (count === 0) {
      res.status(404).json({ status: false, message: "data not found" });
    } else {
      const result = await prisma.roomservicemaster.findMany({
        where: {
          order_date: {
            gte: start,
            lte: end,
          },
        },
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          order_date: true,
          sub_total: true,
          cgst: true,
          sgst: true,
          igst: true,
          discount: true,
          total: true,
          reservationmaster: {
            select: {
              roommaster: {
                select: {
                  id: true,
                  title: true,
                },
              },
              guestmaster: {
                select: {
                  fullname: true,
                  phone_number: true,
                  email: true,
                },
              },
            },
          },
          room_service_item_master: {
            include: {
              fooditemmaster: {
                select: {
                  item_code: true,
                  item_name: true,
                  images: true,
                  tax_type: true,
                },
              },
            },
          },
        },
      });

      result.forEach((item) => {
        item.room_id = item?.reservationmaster?.roommaster?.id;
        item.title = item?.reservationmaster?.roommaster?.title;
        item.email = item?.reservationmaster?.guestmaster?.email;
        item.fullname = item?.reservationmaster?.guestmaster?.fullname;
        item.phone_number = item?.reservationmaster?.guestmaster?.phone_number;
        item.room_service_items = item?.room_service_item_master?.map((ele) => {
          let { fooditemmaster, ...val } = ele;
          return { ...val, ...fooditemmaster };
        });
        delete item.reservationmaster;
        delete item.room_service_item_master;
      });

      //EXTRACT FOOD ID'S FROM ARRAY OF OBJECTS AND THEN FLAPMAPPING THE ARRAY TO GET ONLY UNIQUE ID'S
      // let itemIds = result
      //   .map((item) => {
      //     let id = item.room_service_item_master.map((ele) => ele.item_id);
      //     return id;
      //   })
      //   .flatMap((i) => i);

      // //CONVERTING SET INTO ARRAY
      // itemIds = [...new Set(itemIds)];
      // const roomIds = [...new Set(result.map((r) => r.room_id))];

      // const food = await prisma.fooditemmaster.findMany({
      //   where: {
      //     id: {
      //       in: itemIds,
      //     },
      //   },
      //   select: {
      //     item_code: true,
      //     item_name: true,
      //     images: true,
      //   },
      // });

      // const room = await prisma.roommaster.findMany({
      //   where: {
      //     id: {
      //       in: roomIds,
      //     },
      //   },
      //   select: {
      //     title: true,
      //     images: true,
      //   },
      // });

      res.status(200).json({
        status: true,
        message: "data fetched successfully",
        result,
        // room,
        // food,
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//current day
const currentdayroomservice = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const count = await prisma.roomservicemaster.count({
      where: {
        order_date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    if (count === 0) {
      res.status(404).json({ status: false, message: "data not found" });
    } else {
      const result = await prisma.roomservicemaster.findMany({
        where: {
          order_date: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          order_date: true,
          sub_total: true,
          cgst: true,
          sgst: true,
          igst: true,
          discount: true,
          total: true,
          reservationmaster: {
            select: {
              roommaster: {
                select: {
                  id: true,
                  title: true,
                },
              },
              guestmaster: {
                select: {
                  fullname: true,
                  phone_number: true,
                  email: true,
                },
              },
            },
          },
          room_service_item_master: {
            include: {
              fooditemmaster: {
                select: {
                  item_code: true,
                  item_name: true,
                  images: true,
                  tax_type: true,
                },
              },
            },
          },
        },
      });

      result.forEach((item) => {
        item.room_id = item?.reservationmaster?.roommaster?.id;
        item.title = item?.reservationmaster?.roommaster?.title;
        item.email = item?.reservationmaster?.guestmaster?.email;
        item.fullname = item?.reservationmaster?.guestmaster?.fullname;
        item.phone_number = item?.reservationmaster?.guestmaster?.phone_number;
        item.room_service_items = item?.room_service_item_master?.map((ele) => {
          let { fooditemmaster, ...val } = ele;
          return { ...val, ...fooditemmaster };
        });
        delete item.reservationmaster;
        delete item.room_service_item_master;
      });

      // //EXTRACT FOOD ID'S FROM ARRAY OF OBJECTS AND THEN FLAPMAPPING THE ARRAY TO GET ONLY UNIQUE ID'S
      // let itemIds = result
      //   .map((item) => {
      //     let id = item.room_service_item_master.map((ele) => ele.item_id);
      //     return id;
      //   })
      //   .flatMap((i) => i);

      // //CONVERTING SET INTO ARRAY
      // itemIds = [...new Set(itemIds)];
      // const roomIds = [...new Set(result.map((r) => r.room_id))];

      // const foodItems = await prisma.fooditemmaster.findMany({
      //   where: {
      //     id: {
      //       in: itemIds,
      //     },
      //   },
      //   select: {
      //     item_code: true,
      //     item_name: true,
      //     images: true,
      //   },
      // });

      // const rooms = await prisma.roommaster.findMany({
      //   where: {
      //     id: {
      //       in: roomIds,
      //     },
      //   },
      //   select: {
      //     title: true,
      //     images: true,
      //   },
      // });

      res.status(200).json({
        status: true,
        message: "data fetched successfully",
        result,
        // rooms,
        // foodItems,
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//update payment status
const paymentstatus = async (req, res, next) => {
  try {
    let roomserviceId = +req.params.id;
    const roomservice = await prisma.roomservicemaster.update({
      data: {
        payment_status: "PAID",
      },
      where: {
        id: roomserviceId,
      },
      select: {
        id: true,
        payment_status: true,
      },
    });

    const myCache = req.app.get("cache");
    myCache.del("viewroomservice");
    res.status(200).json({
      status: true,
      message: "Payment status updated successfully",
      roomservice,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

const invoiceNum = async (req, res, next) => {
  try {
    const data = req.body;

    // Check if invoice exists in the database
    const existingInvoice = await prisma.roomservicemaster.findFirst({
      where: {
        invoice_num: data.invoice_num,
      },
    });

    if (existingInvoice) {
      // If invoice exists
      if (existingInvoice.id === data.id) {
        return res.status(200).json({
          status: true,
          message: "This invoice number already exists!",
        });
      }
    } else {
      // If invoice does not exist
      return res.status(200).json({
        status: true,
        message: "This invoice is available!",
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//room invoice by date
const viewroomservicebydate = async (req, res, next) => {
  let {from, to} = req.body
  from = new Date(from);
    to = new Date(to);
  try {
    const result = await prisma.roomservicemaster.findMany({
      where:{
        order_date:{
          gte: from,
          lte: to
        }
      },
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
        order_date: true,
        fullname: true,
        phone_number: true,
        concession: true,
        total: true,
        invoice_num: true,
        payment_status: true,
        check_in: true,
        check_out: true,
        room_service_item_master: {
          include: {
            fooditemmaster: {
              select: {
                item_name: true,
              },
            },
          },
        },
      },
    });

    if (result.length === 0) {
      return res.status(404).json({ status: false, message: "data not found" });
    }

    result?.forEach((el) => {
      el?.room_service_item_master?.forEach((item) => {
        item.item_code = item?.fooditemmaster?.item_code;
        item.item_name = item?.fooditemmaster?.item_name;
        delete item.fooditemmaster;
      });
      el.room_service_items = el?.room_service_item_master;
      delete el?.room_service_item_master;
    });

    // Send the response with the flattened data
    res.status(200).json({
      status: true,
      message: "data fetched successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

module.exports = {
  roomnumbers,
  roomservice,
  fooditems,
  foodprice,
  viewroomservice,
  editroomservice,
  deleteroomservice,
  previousdayroomservices,
  monthlyroomservice,
  weeklyroomservice,
  currentdayroomservice,
  viewroomservicebyid,
  editRoomServiceStatusPaid,
  paymentstatus,
  invoiceNum,
  viewroomservicebydate
};
