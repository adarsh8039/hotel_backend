const {default: id} = require("date-and-time/locale/id");
const {prisma} = require("../../models/connection");
const logger = require("../../utils/logger");

/* BILLING */

//view biils
const allbills = async (req, res, next) => {
  try {
    const {from, to, criteria} = req.body;
    const {userDetails} = req.headers;

    // Build filters for reservationmaster
    const reservationFilters = [];
    if (criteria === "check_in") {
      reservationFilters.push({
        check_in: {
          gte: new Date(from).toISOString(),
          lte: new Date(to).toISOString(),
        },
      });
    }

    if (criteria === "check_out") {
      reservationFilters.push({
        check_out: {
          gte: new Date(from).toISOString(),
          lte: new Date(to).toISOString(),
        },
      });
    }

    if (criteria === "departure_time") {
      reservationFilters.push({
        departure_time: {
          gte: new Date(from).toISOString(),
          lte: new Date(to).toISOString(),
        },
      });
    }

    // Build filters for billingmaster
    const billingFilters = [];
    if (criteria === "invoice_date") {
      billingFilters.push({
        invoice_date: {
          not: null, // Ensure invoice_date is not null
        },
      });
    }

    const result = await prisma.reservationmaster.findMany({
      where: {
        vendor_user_id: userDetails.id,
        AND: reservationFilters,
      },
      orderBy: {
        id: "desc",
      },
      include: {
        roommaster: {
          select: {
            title: true,
            perdayprice: true,
            floor_no: true,
          },
        },
        billingmaster: {
          where: {
            AND: billingFilters,
          },
          select: {
            id: true,
            invoice_date: true,
            guest_email: true,
            invoice_num: true,
            guest_name: true,
            mobile_no: true,
            company_gst: true,
            company_name: true,
          },
        },
      },
    });

    if (result.length === 0) {
      return res.status(404).json({status: false, message: "No data found"});
    }

    // Filter and map results using JavaScript function for invoice_date criteria
    const filteredResult = result
      .filter((ser) => {
        if (criteria === "invoice_date") {
          return ser.billingmaster.some((bill) => {
            const invoiceDate = new Date(bill.invoice_date);
            return invoiceDate >= new Date(from) && invoiceDate <= new Date(to);
          });
        }
        return true;
      })
      .map((ser) => {
        const {billingmaster, ...other} = ser;
        other.bill_id = billingmaster[0]?.id;
        delete billingmaster[0]?.id;
        const _ser = {...other, ...billingmaster[0]};
        _ser.room = _ser.roommaster;
        _ser.email = _ser.guest_email;
        _ser.fullname = _ser.guest_name;
        _ser.phone_number = _ser.mobile_no;
        delete _ser.roommaster;
        delete _ser.guest_email;
        delete _ser.guest_name;
        delete _ser.mobile_no;
        return _ser;
      });

    if (filteredResult.length === 0) {
      return res
        .status(404)
        .json({status: false, message: "No data found for invoice_date"});
    }

    res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      result: filteredResult,
    });
  } catch (error) {
    logger.error(error);
    console.error("Error: ", error);
    res.status(500).json({status: false, message: error.message});
  }
};

//room invoice
const roominvoice = async (req, res, next) => {
  try {
    const id = +(await req.params.id);

    // Check if the reservation exists
    const count = await prisma.reservationmaster.count({
      where: {
        id: id,
      },
    });

    if (count === 0) {
      res.status(404).json({status: false, message: "Data not found"});
    } else {
      const result = await prisma.reservationmaster.findFirst({
        where: {
          id,
        },
        orderBy: {
          id: "asc",
        },
        include: {
          roommaster: {
            select: {
              title: true,
              bed_type: true,
              perdayprice: true,
              description: true,
            },
          },
          billingmaster: {
            select: {
              company_gst: true,
              company_name: true,
              guest_name: true,
              guest_email: true,
              mobile_no: true,
              invoice_date: true,
              invoice_num: true,
            },
          },
        },
      });
      result.room = result?.roommaster;
      delete result?.roommaster;

      if (result?.billingmaster && result?.billingmaster.length > 0) {
        result.guest = result?.billingmaster[0];
        result.guest.fullname = result?.guest?.guest_name;
        result.guest.email = result?.guest?.guest_email;
        result.guest.phone_number = result?.guest?.mobile_no;
        result.invoice_date = result?.billingmaster[0]?.invoice_date;
        result.invoice_num = result?.billingmaster[0]?.invoice_num;

        delete result?.billingmaster[0]?.invoice_date;
        delete result?.guest?.guest_name;
        delete result?.guest?.guest_email;
        delete result?.guest?.mobile_no;
        delete result?.billingmaster[0]?.invoice_num;
        delete result?.billingmaster;
      }

      res.status(200).json({
        status: true,
        message: "Data fetched successfully",
        result: result,
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//order invoice
const orderinvoice = async (req, res, next) => {
  try {
    const id = +req.params.id;

    const count = await prisma.reservationmaster.count({
      where: {
        id,
      },
    });

    if (count === 0) {
      res.status(404).json({status: false, message: "data not found"});
    } else {
      const result = await prisma.reservationmaster.findMany({
        where: {
          id: id,
        },
        include: {
          roommaster: {
            select: {
              title: true,
            },
          },
          guestmaster: {
            select: {
              fullname: true,
              email: true,
              phone_number: true,
            },
          },
          roomservicemaster: {
            include: {
              room_service_item_master: {
                select: {
                  fooditemmaster: {
                    select: {
                      id: true,
                      item_code: true,
                      item_name: true,
                      price: true,
                    },
                  },
                  quantity: true,
                  price: true,
                  total: true,
                },
              },
            },
          },
        },
      });

      if (result.length === 0) {
        res
          .status(404)
          .json({status: false, message: "No orders found for this room"});
        return;
      }

      result.forEach((ser) => {
        ser.guest = ser.guestmaster;
        ser.room = ser.roommaster;
        ser.roomservicemaster.forEach((item) => {
          item.room_service_item_master.forEach((ele) => {
            ele.itemDetail = ele.fooditemmaster;
            delete ele.fooditemmaster;
          });
        });
        ser.roomservicemaster.forEach((item) => {
          item.items = [...item.room_service_item_master];
          delete item.room_service_item_master;
        });
        ser.roomservice = [...ser.roomservicemaster];

        delete ser.guestmaster;
        delete ser.roommaster;
        delete ser.roomservicemaster;
      });

      res.status(200).json({
        status: true,
        message: "data fetched successfully",
        // user,
        result,
      });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//both room and order invoice
const completeInvoice = async (req, res, next) => {
  try {
    const id = +(await req.params.id);

    // Check if the reservation exists
    const count = await prisma.reservationmaster.count({
      where: {
        id,
      },
    });

    if (count === 0) {
      res.status(404).json({status: false, message: "Data not found"});
      return;
    }

    const result = await prisma.reservationmaster.findMany({
      where: {
        id: id,
      },
      include: {
        guestmaster: {
          select: {
            fullname: true,
            email: true,
            phone_number: true,
          },
        },
        roommaster: {
          select: {
            id: true,
            title: true,
            bed_type: true,
            perdayprice: true,
            description: true,
          },
        },
        roomservicemaster: {
          include: {
            room_service_item_master: {
              select: {
                fooditemmaster: {
                  select: {
                    id: true,
                    item_code: true,
                    item_name: true,
                    price: true,
                  },
                },
                quantity: true,
                price: true,
                total: true,
              },
            },
          },
        },
      },
    });

    result.forEach((ser) => {
      ser.guest = ser.guestmaster;
      ser.room = ser.roommaster;
      ser.roomservicemaster.forEach((item) => {
        item.room_service_item_master.forEach((ele) => {
          ele.itemDetail = ele.fooditemmaster;
          delete ele.fooditemmaster;
        });
      });
      ser.roomservicemaster.forEach((item) => {
        item.items = [...item.room_service_item_master];
        delete item.room_service_item_master;
      });
      ser.roomservice = [...ser.roomservicemaster];

      delete ser.guestmaster;
      delete ser.roommaster;
      delete ser.roomservicemaster;
    });

    res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

/* REPORTS */

//booked rooms
const bookedrooms = async (req, res, next) => {
  try {
    const {userDetails} = req.headers;
    // Fetch all rooms with status 'Booked'
    const result = await prisma.reservationmaster.findMany({
      where: {
        vendor_user_id: userDetails.id,
        status: "COMPLETED",
      },
      include: {
        roommaster: {
          select: {
            id: true,
            title: true,
            bed_type: true,
            perdayprice: true,
            description: true,
            images: true,
            floor_no: true,
          },
        },
        guestmaster: {
          select: {
            id: true,
            email: true,
            phone_number: true,
            fullname: true,
          },
        },
      },
      orderBy: {
        room_id: "asc",
      },
    });

    // If no booked rooms found
    if (result.length === 0) {
      res
        .status(404)
        .json({status: false, message: "No booked rooms found", result: []});
      return;
    }

    result.forEach((ser) => {
      ser.guest = ser.guestmaster;
      ser.room = ser.roommaster;

      delete ser.guestmaster;
      delete ser.roommaster;
    });

    res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//booked room with date filtering
const bookedroomswithdate = async (req, res, next) => {
  try {
    let {from, to} = await req.body;
    let user_id = req.body.id;

    from = new Date(from);
    to = new Date(to);

    let conditions = {
      status: "COMPLETED",
      booking_date: {
        gt: from,
        lte: to,
      },
    };

    if (user_id) {
      conditions.guestmaster = {
        id: +user_id,
      };
    }

    // Fetch all rooms with status 'Booked'
    let result = await prisma.reservationmaster.findMany({
      where: conditions,
      include: {
        roommaster: {
          select: {
            id: true,
            title: true,
            bed_type: true,
            perdayprice: true,
            description: true,
            floor_no: true,
          },
        },
        guestmaster: {
          select: {
            id: true,
            email: true,
            phone_number: true,
            fullname: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    // If no booked rooms found
    if (result.length === 0) {
      return res
        .status(404)
        .json({status: false, message: "No booked rooms found"});
    }

    result.forEach((ser) => {
      ser.guest = ser.guestmaster;
      ser.room = ser.roommaster;

      delete ser.guestmaster;
      delete ser.roommaster;
    });

    res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//cancel rooms
const cancelrooms = async (req, res, next) => {
  try {
    // Fetch all rooms with status 'Booked'
    const result = await prisma.reservationmaster.findMany({
      where: {
        status: "CANCELLED",
      },
      include: {
        roommaster: {
          select: {
            id: true,
            title: true,
            bed_type: true,
            perdayprice: true,
            description: true,
            images: true,
            floor_no: true,
          },
        },
        guestmaster: {
          select: {
            id: true,
            email: true,
            phone_number: true,
            fullname: true,
          },
        },
      },
      orderBy: {
        room_id: "asc",
      },
    });

    // If no booked rooms found
    if (result.length === 0) {
      res
        .status(404)
        .json({status: false, message: "No cancelled rooms found"});
      return;
    }

    result.forEach((ser) => {
      ser.guest = ser.guestmaster;
      ser.room = ser.roommaster;

      delete ser.guestmaster;
      delete ser.roommaster;
    });

    res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//cancel room with date filtering
const cancelroomswithdate = async (req, res, next) => {
  try {
    let {from, to} = await req.body;
    const user_id = req.body.id;

    from = new Date(from);
    to = new Date(to);

    let conditions = {
      status: "CANCELLED",
      booking_date: {
        gt: from,
        lte: to,
      },
    };

    if (user_id) {
      conditions.guestmaster = {
        id: +user_id,
      };
    }

    // Fetch all rooms with status 'Booked'
    let result = await prisma.reservationmaster.findMany({
      where: conditions,
      include: {
        roommaster: {
          select: {
            id: true,
            title: true,
            bed_type: true,
            perdayprice: true,
            description: true,
            images: true,
            floor_no: true,
          },
        },
        guestmaster: {
          select: {
            id: true,
            email: true,
            phone_number: true,
            fullname: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    // If no booked rooms found
    if (result.length === 0) {
      return res
        .status(404)
        .json({status: false, message: "No cancelled rooms found"});
    }

    result.forEach((ser) => {
      ser.guest = ser.guestmaster;
      ser.room = ser.roommaster;

      delete ser.guestmaster;
      delete ser.roommaster;
    });

    res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//food order report
const foodorder = async (req, res, next) => {
  try {
    // Fetch food orders
    let result = await prisma.roomservicemaster.findMany({
      include: {
        reservationmaster: {
          select: {
            roommaster: {
              select: {
                title: true,
                floor_no: true,
                id: true,
              },
            },
            guestmaster: {
              select: {
                id: true,
                email: true,
                phone_number: true,
              },
            },
          },
        },
        room_service_item_master: {
          select: {
            quantity: true,
            total: true,
            fooditemmaster: {
              select: {
                item_code: true,
                item_name: true,
              },
            },
          },
        },
      },
    });

    result.forEach((ser) => {
      ser.fooditems = ser.room_service_item_master.map((item) => {
        let food = item?.fooditemmaster;
        delete item?.fooditemmaster;
        return {...item, ...food};
      });
      ser.guest = ser?.reservationmaster?.guestmaster;
      ser.room = ser?.reservationmaster?.roommaster;

      delete ser?.room_service_item_master;
      delete ser?.reservationmaster;
    });

    if (result.length === 0) {
      return res.status(404).json({status: false, message: "No data found"});
    }

    res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

// food order report with date filtering
const foodorderwithdate = async (req, res, next) => {
  try {
    let {from, to, phone_number} = await req.body;

    from = new Date(from);
    to = new Date(to);

    let result = await prisma.roomservicemaster.findMany({
      where: {
        ...(phone_number && {phone_number: phone_number}),
      },
      include: {
        reservationmaster: {
          select: {
            roommaster: {
              select: {
                title: true,
                floor_no: true,
                id: true,
              },
            },
            guestmaster: {
              select: {
                id: true,
                email: true,
                phone_number: true,
              },
            },
          },
        },
        room_service_item_master: {
          select: {
            quantity: true,
            total: true,
            fooditemmaster: {
              select: {
                item_name: true,
              },
            },
          },
        },
      },
    });

    result.forEach((ser) => {
      ser.fooditems = ser?.room_service_item_master.map((item) => {
        let food = item?.fooditemmaster;
        delete item?.fooditemmaster;
        return {...item, ...food};
      });
      ser.guest = ser?.reservationmaster?.guestmaster;
      ser.room = ser?.reservationmaster?.roommaster;
      ser.food = ser?.reservationmaster?.fooditemmaster;

      delete ser?.room_service_item_master;
      delete ser?.reservationmaster;
    });

    res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//user report
const userreport = async (req, res, next) => {
  try {
    const result = await prisma.guestmaster.findMany({
      where: {
        NOT: {
          role_id: 1,
        },
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        image: true,
        phone_number: true,
      },
    });

    res
      .status(200)
      .json({status: true, message: "Data fetched successfully", result});
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//user report with date filtering
const userwithdate = async (req, res, next) => {
  try {
    let {from, to} = await req.body;
    let user_id = req.body.id;

    from = new Date(from);
    to = new Date(to);

    let result = await prisma.guestmaster.findMany({
      where: {
        ...(user_id && {id: +user_id}),
        created_at: {
          gt: from,
          lte: to,
        },
        NOT: {
          role_id: 1,
        },
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        image: true,
        phone_number: true,
      },
    });

    if (result.length === 0) {
      return res.status(404).json({status: false, message: "No data found"});
    }

    res
      .status(200)
      .json({status: true, message: "Data fetched successfully", result});
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//all booking
const allbooking = async (req, res, next) => {
  try {
    // Fetch all rooms with status 'Booked'
    const result = await prisma.reservationmaster.findMany({
      include: {
        roommaster: {
          select: {
            id: true,
            title: true,
            bed_type: true,
            perdayprice: true,
            description: true,
            images: true,
            floor_no: true,
          },
        },
        user_reservation_master: {
          select: {
            guest_id: true,
            reservation_id: true,
          },
        },
        guestmaster: {
          select: {
            id: true,
            email: true,
            phone_number: true,
            fullname: true,
          },
        },
      },
      orderBy: {
        room_id: "asc",
      },
    });

    // If no rooms found
    if (result.length === 0) {
      res.status(404).json({status: false, message: "No rooms found"});
      return;
    }

    result.forEach((ser) => {
      ser.guest = ser?.guestmaster;
      ser.room = ser?.roommaster;

      delete ser?.guestmaster;
      delete ser?.roommaster;
    });

    res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//all booking with filter
const bookingwithdate = async (req, res, next) => {
  try {
    let {from, to} = await req.body;

    from = new Date(from);
    to = new Date(to);

    // Fetch all rooms with status 'Booked'
    let result = await prisma.reservationmaster.findMany({
      where: {
        status: "BOOKED",
        booking_date: {
          gt: from,
          lte: to,
        },
      },
      include: {
        roommaster: {
          select: {
            id: true,
            title: true,
            bed_type: true,
            perdayprice: true,
            description: true,
            floor_no: true,
          },
        },
        user_reservation_master: {
          select: {
            guest_id: true,
            reservation_id: true,
          },
        },
        guestmaster: {
          select: {
            id: true,
            email: true,
            phone_number: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    // If no booked rooms found
    if (result.length === 0) {
      return res
        .status(404)
        .json({status: false, message: "No booked rooms found"});
    }

    result.forEach((ser) => {
      ser.guest = ser?.guestmaster;
      ser.room = ser?.roommaster;

      delete ser?.guestmaster;
      delete ser?.roommaster;
    });

    res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//update bulk invoice payment status
const paymentstatus = async (req, res, next) => {
  try {
    let invoiceNum = +req.params.id;
    const reservation = await prisma.reservationmaster.findMany({
      where: {
        invoice_num: invoiceNum,
      },
      select: {
        id: true,
      },
    });
    const roomServices = await prisma.roomservicemaster.findMany({
      where: {
        reservation_id: reservation.id,
      },
    });
    const updatedRoomServices = await Promise.all(
      roomServices.map(async (service) => {
        return await prisma.roomservicemaster.update({
          where: {
            id: service.id,
          },
          data: {
            payment_status: "PAID",
          },
          select: {
            id: true,
            payment_status: true,
          },
        });
      })
    );

    res.status(200).json({
      status: true,
      message: "Payment status updated successfully",
      reservation,
      updatedRoomServices,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

const updateInvoiceGSTStatus = async (req, res, next) => {
  try {
    const reservationId = +req.params.id;
    const {gst_status} = req.body;

    // Fetch reservations with the given invoice number
    const reservations = await prisma.reservationmaster.findMany({
      where: {
        id: reservationId,
      },
      select: {
        id: true,
        total_price: true,
        cgst: true,
        sgst: true,
        igst: true,
        taxable_price: true,
      },
    });

    // Check if any reservations were found
    if (reservations.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Reservation not found",
      });
    }

    // Process each reservation
    const updatedReservations = await Promise.all(
      reservations.map(async (reservation) => {
        let updatedGrandTotal = reservation.total_price;

        if (!gst_status) {
          // Subtract the sum of igst, cgst, and sgst from taxable_price
          const gstSum = reservation.igst + reservation.cgst + reservation.sgst;
          updatedGrandTotal -= gstSum;
        }

        return await prisma.reservationmaster.update({
          where: {
            id: reservation.id,
          },
          data: {
            gst_status,
            total_price: updatedGrandTotal,
            payment_status: "PAID",
            remaining_amount: 0,
            received_amount: updatedGrandTotal,
            ...(gst_status === false && {
              cgst: 0,
              sgst: 0,
              igst: 0,
              taxable_price: 0,
            }),
          },
          select: {
            id: true,
            gst_status: true,
            total_price: true,
            payment_status: true,
            remaining_amount: true,
            cgst: true,
            sgst: true,
            igst: true,
            taxable_price: true,
          },
        });
      })
    );

    res.status(200).json({
      status: true,
      message: "GST status and payment status updated successfully",
      updatedReservations,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

const updateInvoiceStatusComplete = async (req, res, next) => {
  try {
    let reservationId = +req.params.id;
    let departureTime = new Date();
    console.log(departureTime);

    let data = await prisma.reservationmaster.findFirst({
      where: {
        id: reservationId,
      },
    });

    if (!data) {
      return res.status(400).json({
        status: false,
        message: "No reservation found for this invoice.",
      });
    }

    const transaction = await prisma.$transaction(async (prisma) => {
      const lastInvoice = await prisma.reservationmaster.findFirst({
        select: {invoice_num: true},
        orderBy: {invoice_num: "desc"},
      });

      let nextInvoiceNum = lastInvoice ? lastInvoice.invoice_num + 1 : 1;

      const reservation = await prisma.reservationmaster.update({
        data: {
          status: "COMPLETED",
          departure_time: departureTime,
          invoice_num: nextInvoiceNum,
        },
        where: {
          id: reservationId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      const billingRecord = await prisma.billingmaster.findFirst({
        where: {
          reservation_id: reservationId,
        },
        select: {
          id: true,
        },
      });

      if (!billingRecord) {
        throw new Error("No billing record found for this reservation.");
      }

      const billing = await prisma.billingmaster.update({
        where: {
          id: billingRecord.id,
        },
        data: {
          invoice_num: nextInvoiceNum,
        },
      });

      return {reservation, billing};
    });

    res.status(200).json({
      status: true,
      message: "Guest checked out successfully",
      reservation: transaction.reservation,
      billing: transaction.billing,
    });
  } catch (error) {
    logger.error(error);
    if (error.message.includes("billing record")) {
      return res.status(400).json({
        status: false,
        message: error.message,
      });
    }
    res.status(500).json({status: false, message: error.message});
  }
};

// Guest history
const guestHistorywithdate = async (req, res, next) => {
  try {
    let {from, to} = await req.body;
    const user_id = req.body.id;

    from = new Date(from);
    to = new Date(to);

    const guest = await prisma.guestmaster.findMany({
      where: {
        ...(user_id && {id: +user_id}),
        NOT: {
          role_id: 1,
        },
        reservationmaster: {
          every: {
            booking_date: {
              gt: from,
              lte: to,
            },
          },
        },
      },
      include: {
        user_reservation_master: {
          select: {
            company_master: {
              select: {
                company_gst: true,
                company_name: true,
              },
            },
          },
        },
        reservationmaster: {
          select: {
            id: true,
            booking_date: true,
            check_in: true,
            check_out: true,
            total_days: true,
            roommaster: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      result: guest,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//cancel checkout (invoice)
const canclecheckout = async (req, res, next) => {
  try {
    let reservationId = +req.params.id;

    let data = await prisma.reservationmaster.findFirst({
      where: {
        id: reservationId,
      },
      select: {
        id: true,
      },
    });

    if (!data) {
      return res.status(400).json({
        status: false,
        message: "No invoice found.",
      });
    }

    const result2 = await prisma.reservationmaster.update({
      where: {
        id: data.id,
      },
      data: {
        status: "BOOKED",
        invoice_num: null,
        departure_time: null,
      },
    });

    const billing = await prisma.billingmaster.findFirst({
      where: {
        reservation_id: result2.id,
      },
      select: {
        id: true,
      },
    });

    const result = await prisma.billingmaster.update({
      data: {
        invoice_date: null,
        invoice_num: null,
      },
      where: {
        id: billing.id,
      },
      select: {
        id: true,
      },
    });

    res.status(200).json({
      status: true,
      message: "Invoice cancelled successfully",
      result2,
      result,
    });
  } catch (error) {
    logger.error(error);
    console.log(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//all bills by date
const allbillsbydate = async (req, res, next) => {
  try {
    let {from, to} = req.body;
    from = new Date(from);
    to = new Date(to);
    const result = await prisma.reservationmaster.findMany({
      where: {
        AND: [
          {
            check_in: {
              lt: to,
            },
          },
          {
            check_out: {
              gt: from,
            },
          },
        ],
      },
      orderBy: {
        id: "desc",
      },
      include: {
        roommaster: {
          select: {
            title: true,
            perdayprice: true,
            floor_no: true,
          },
        },
        billingmaster: {
          select: {
            id: true,
            invoice_date: true,
            guest_email: true,
            invoice_num: true,
            guest_name: true,
            mobile_no: true,
            company_gst: true,
            company_name: true,
          },
        },
      },
    });

    if (result.length === 0) {
      return res.status(404).json({status: false, message: "No data found"});
    }

    let _result = result.map((ser) => {
      let {billingmaster, ...other} = ser;
      other.bill_id = billingmaster[0]?.id;
      delete billingmaster[0]?.id;
      let _ser = {...other, ...billingmaster[0]};
      _ser.room = _ser.roommaster;
      _ser.email = _ser.guest_email;
      _ser.fullname = _ser.guest_name;
      _ser.phone_number = _ser.mobile_no;
      delete _ser.roommaster;
      delete _ser.guest_email;
      delete _ser.guest_name;
      delete _ser.mobile_no;
      return _ser;
    });

    res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      result: _result,
    });
  } catch (error) {
    logger.error(error);
    console.error("Error: ", error);
    res.status(500).json({status: false, message: error.message});
  }
};

module.exports = {
  allbills,
  roominvoice,
  orderinvoice,
  completeInvoice,
  bookedrooms,
  bookedroomswithdate,
  cancelrooms,
  cancelroomswithdate,
  foodorder,
  foodorderwithdate,
  userreport,
  allbooking,
  bookingwithdate,
  userwithdate,
  // bulkinvoice,
  paymentstatus,
  updateInvoiceGSTStatus,
  updateInvoiceStatusComplete,
  guestHistorywithdate,
  updateInvoiceStatusComplete,
  canclecheckout,
  allbillsbydate,
};
