const { prisma } = require("../../models/connection");
const {
  subWeeks,
  startOfWeek,
  startOfMonth,
  startOfYear,
  format,
} = require("date-fns");
const {
  generateMonths,
  convertToIndianStandard,
} = require("../../utils/dateFormatter");
const logger = require("../../utils/logger");
const moment = require("moment");

//dashboard details
const dashboardDetails = async (req, res, next) => {
  try {
    let cardDetails = {
      totalRental: {
        weekly: 0,
        monthly: 0,
        yearly: 0,
      },
      totalPendingRental: {
        weekly: 0,
        monthly: 0,
        yearly: 0,
      },
      totalRoomService: {
        weekly: 0,
        monthly: 0,
        yearly: 0,
      },
      totalIncome: {
        weekly: 0,
        monthly: 0,
        yearly: 0,
      },
      totalExpense: {
        weekly: 0,
        monthly: 0,
        yearly: 0,
      },
    };

    //GENERATING DATES FOR FILTERING WEEK , MONTH , YEAR
    const endDate = new Date();
    const weekStart = startOfWeek(endDate, { weekStartsOn: 1 });
    const monthStart = startOfMonth(endDate);
    const yearStart = startOfYear(endDate);

    //CALCUALTING TOTAL RENTAL INCOME
    //WEEKLY
    let totalRental = await prisma.reservationmaster.aggregate({
      _sum: {
        received_amount: true,
      },
      where: {
        check_in: {
          gt: weekStart,
          lte: endDate,
        },
        status: {
          not: {
            equals: "CANCELLED",
          },
        },
        payment_status: {
          not: {
            equals: "UNPAID",
          },
        },
      },
    });
    cardDetails.totalRental.weekly = totalRental._sum.received_amount;
    //MONTHLY
    totalRental = await prisma.reservationmaster.aggregate({
      _sum: {
        received_amount: true,
      },
      where: {
        check_in: {
          gt: monthStart,
          lte: endDate,
        },
        status: {
          not: {
            equals: "CANCELLED",
          },
        },
        payment_status: {
          not: {
            equals: "UNPAID",
          },
        },
      },
    });
    cardDetails.totalRental.monthly = totalRental._sum.received_amount;
    //YEARLY
    totalRental = await prisma.reservationmaster.aggregate({
      _sum: {
        received_amount: true,
      },
      where: {
        check_in: {
          gt: yearStart,
          lte: endDate,
        },
        status: {
          not: {
            equals: "CANCELLED",
          },
        },
        payment_status: {
          not: {
            equals: "UNPAID",
          },
        },
      },
    });
    cardDetails.totalRental.yearly = totalRental._sum.received_amount;

    //CALCUALTING TOTAL RENTAL INCOME
    //WEEKLY
    let totalPendingRental = await prisma.reservationmaster.aggregate({
      _sum: {
        remaining_amount: true,
      },
      where: {
        check_in: {
          gt: weekStart,
          lte: endDate,
        },
        status: {
          not: {
            equals: "CANCELLED",
          },
        },
        payment_status: {
          not: {
            equals: "PAID",
          },
        },
      },
    });
    cardDetails.totalPendingRental.weekly =
      totalPendingRental._sum.remaining_amount;
    //MONTHLY
    totalPendingRental = await prisma.reservationmaster.aggregate({
      _sum: {
        remaining_amount: true,
      },
      where: {
        check_in: {
          gt: monthStart,
          lte: endDate,
        },
        status: {
          not: {
            equals: "CANCELLED",
          },
        },
        payment_status: {
          not: {
            equals: "PAID",
          },
        },
      },
    });
    cardDetails.totalPendingRental.monthly =
      totalPendingRental._sum.remaining_amount;
    //YEARLY
    totalPendingRental = await prisma.reservationmaster.aggregate({
      _sum: {
        remaining_amount: true,
      },
      where: {
        check_in: {
          gt: yearStart,
          lte: endDate,
        },
        status: {
          not: {
            equals: "CANCELLED",
          },
        },
        payment_status: {
          not: {
            equals: "PAID",
          },
        },
      },
    });
    cardDetails.totalPendingRental.yearly =
      totalPendingRental._sum.remaining_amount;

    //CALCUALTING TOTAL RENTAL INCOME
    //WEEKLY
    let totalExpense = await prisma.expenses_master.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        date: {
          gt: weekStart,
          lte: endDate,
        },
      },
    });
    cardDetails.totalExpense.weekly = totalExpense._sum.amount;
    //MONTHLY
    totalExpense = await prisma.expenses_master.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        date: {
          gt: monthStart,
          lte: endDate,
        },
      },
    });
    cardDetails.totalExpense.monthly = totalExpense._sum.amount;
    //YEARLY
    totalExpense = await prisma.expenses_master.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        date: {
          gt: yearStart,
          lte: endDate,
        },
      },
    });
    cardDetails.totalExpense.yearly = totalExpense._sum.amount;

    //CALCUALTING TOTAL FOOD INCOME
    //WEEKLY
    let totalService = await prisma.roomservicemaster.aggregate({
      _sum: {
        total: true,
      },
      where: {
        order_date: {
          gt: weekStart,
          lte: endDate,
        },
        payment_status: "PAID",
      },
    });
    cardDetails.totalRoomService.weekly = totalService._sum.total;
    //MONTHLY
    totalService = await prisma.roomservicemaster.aggregate({
      _sum: {
        total: true,
      },
      where: {
        order_date: {
          gt: monthStart,
          lte: endDate,
        },
        payment_status: "PAID",
      },
    });
    cardDetails.totalRoomService.monthly = totalService._sum.total;
    //YEARLY
    totalService = await prisma.roomservicemaster.aggregate({
      _sum: {
        total: true,
      },
      where: {
        order_date: {
          gt: yearStart,
          lte: endDate,
        },
        payment_status: "PAID",
      },
    });
    cardDetails.totalRoomService.yearly = totalService._sum.total;

    //CALCUALTING TOTAL INCOME

    cardDetails.totalIncome.weekly =
      cardDetails.totalRental.weekly -
      // cardDetails.totalRoomService.weekly -
      cardDetails.totalPendingRental.weekly;

    cardDetails.totalIncome.monthly =
      cardDetails.totalRental.monthly -
      // cardDetails.totalRoomService.monthly -
      cardDetails.totalPendingRental.monthly;

    cardDetails.totalIncome.yearly =
      cardDetails.totalRental.yearly -
      // cardDetails.totalRoomService.yearly -
      cardDetails.totalPendingRental.yearly;

    //GENERATING MONTH FOR CHARTS
    const months = generateMonths(moment().format("YYYY"));

    //CALCULATING TOTAL VISITORS OVER YEARS
    const visitors = await Promise.all(
      months.map(async (month) => {
        let nextMonth = new Date(month);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        let totalVisitors = await prisma.reservationmaster.count({
          where: {
            check_in: {
              gte: month,
              lt: nextMonth,
            },
            status: "COMPLETED",
            payment_status: "PAID",
          },
        });

        return {
          month: month,
          total_visitors: totalVisitors,
        };
      })
    );
    visitors.sort((a, b) => a.month - b.month);

    //CALCULATING TOTAL BOOKED BASED ON ROOM CATEGORY
    let groupedRooms = await prisma.reservationmaster.groupBy({
      by: "room_id",
      where: {
        check_in: {
          gte: yearStart,
          lt: endDate,
        },
        status: "COMPLETED",
        payment_status: "PAID",
      },
      _count: {
        room_id: true,
      },
    });
    let bedTypeCounts = await Promise.all(
      groupedRooms.map(async (result) => {
        if (result._count.room_id !== 0) {
          const room = await prisma.roommaster.findFirst({
            where: {
              id: result?.room_id,
            },
            select: {
              bed_type: true,
            },
          });

          return {
            bed_type: room?.bed_type,
            count: result?._count?.room_id,
          };
        }
      })
    );

    const roomSales = bedTypeCounts.reduce((acc, curr) => {
      if (acc[curr?.bed_type]) {
        acc[curr?.bed_type] += curr?.count;
      } else {
        acc[curr?.bed_type] = curr?.count;
      }
      return acc;
    }, {});

    //FETCHING TABLE DATA
    const recentOrders = await prisma.roomservicemaster.findMany({
      take: 12,
      orderBy: {
        order_date: "desc", // Sorting by order_date in descending order
      },
      select: {
        id: true,
        order_date: true,
        concession: true,
        fullname: true,
        phone_number: true,
        invoice_num: true,
        payment_status: true,
        sub_total: true,
        total: true,
      },
    });
    const startOfDay = new Date();
    startOfDay.setHours(12, 59, 59, 999);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const recentBookings = await prisma.reservationmaster.findMany({
      orderBy: {
        check_in: "desc",
      },
      select: {
        id: true,
        room_id: true,
        user_id: true,
        invoice_num: true,
        check_in: true,
        check_out: true,
        roommaster: {
          select: {
            id: true,
            images: true,
            title: true,
          },
        },
        guestmaster: {
          select: {
            id: true,
            fullname: true,
            phone_number: true,
          },
        },
      },
      where: {
        AND: [
          { status: "BOOKED" },
          // {
          //   check_in: {
          //     lte: endOfDay,
          //   },
          // },
          // {
          //   check_out: {
          //     gte: startOfDay,
          //   },
          // },
        ],
      },
    });
    const recentCheckIns = await prisma.reservationmaster.findMany({
      orderBy: {
        check_in: "desc",
      },
      select: {
        id: true,
        room_id: true,
        check_in: true,
        user_id: true,
        roommaster: {
          select: {
            id: true,
            images: true,
            title: true,
          },
        },
        guestmaster: {
          select: {
            id: true,
            fullname: true,
            phone_number: true,
          },
        },
      },
      where: {
        status: "BOOKED",
        check_in: {
          not: null,
        },
      },
    });

    res.status(200).json({
      status: true,
      message: "data fetched successfully",
      cardDetails,
      visitors,
      roomSales,
      recentOrders,
      recentBookings,
      recentCheckIns,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

const getBarChatData = async (req, res, next) => {
  try {
    let { year } = await req.query;

    //GENERATING MONTH FOR CHARTS
    const months = generateMonths(moment(year).format("YYYY"));

    //CALCULATING TOTAL VISITORS OVER YEARS
    const visitors = await Promise.all(
      months.map(async (month) => {
        let nextMonth = new Date(month);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        let totalVisitors = await prisma.reservationmaster.count({
          where: {
            check_in: {
              gte: month,
              lt: nextMonth,
            },
            status: "COMPLETED",
            payment_status: "PAID",
          },
        });

        return {
          month: month,
          total_visitors: totalVisitors,
        };
      })
    );
    visitors.sort((a, b) => a.month - b.month);

    res.status(200).json({
      status: true,
      message: "Data fetched successfully!",
      visitors,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

const getPieChatData = async (req, res, next) => {
  try {
    let { time } = await req.query;

    let start = moment(time).startOf("month").add(1, "day").toISOString();
    let end = moment(time).endOf("month").toISOString();

    //CALCULATING TOTAL BOOKED BASED ON ROOM CATEGORY
    let groupedRooms = await prisma.reservationmaster.groupBy({
      by: "room_id",
      where: {
        check_in: {
          gte: start,
          lt: end,
        },
        status: "COMPLETED",
        payment_status: "PAID",
      },
      _count: {
        room_id: true,
      },
    });

    let bedTypeCounts = await Promise.all(
      groupedRooms.map(async (result) => {
        if (result._count.room_id !== 0) {
          const room = await prisma.roommaster.findFirst({
            where: {
              id: result?.room_id,
            },
            select: {
              bed_type: true,
            },
          });

          return {
            bed_type: room?.bed_type,
            count: result?._count?.room_id,
          };
        }
      })
    );

    const roomSales = bedTypeCounts.reduce((acc, curr) => {
      if (acc[curr?.bed_type]) {
        acc[curr?.bed_type] += curr?.count;
      } else {
        acc[curr?.bed_type] = curr?.count;
      }
      return acc;
    }, {});

    res.status(200).json({
      status: true,
      message: "Data fetched successfully!",
      roomSales,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//upload bulk images
const uploadImages = async (req, res) => {
  try {
    const images = await req.files.map((file) => file.filename);
    res
      .status(200)
      .json({ status: true, message: "Images uploaded successfully!", images });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

// global search
const dataObject = {
  guest: { value: "guest", link: "guest" },
  rooms: { value: "rooms", link: "rooms" },
  bookings: { value: "bookings", link: "booking-record" },
  "recent booking": { value: "recent booking", link: "booking-record" },
  "booked rooms": { value: "booked rooms", link: "rooms" },
  orders: { value: "orders", link: "room-service" },
  "recent orders": { value: "recent orders", link: "room-service" },
  "check in": { value: "check in", link: "booking-record" },
  "check out": { value: "check out", link: "booking-record" },
  guests: { value: "guests", link: "guest" },
  "room services": { value: "room services", link: "room-service" },
  services: { value: "services", link: "room-service" },
  foods: { value: "foods", link: "item" },
  "food items": { value: "food items", link: "item" },
  invoice: { value: "invoice", link: "billing" },
  billing: { value: "billing", link: "billing" },
  "room invoice": { value: "room invoice", link: "billing" },
  "order invoice": { value: "order invoice", link: "billing" },
  reports: { value: "reports", link: "reports" },
  expenses: { value: "expenses", link: "expese" },
  "booking reports": { value: "booking reports", link: "reports" },
  "food category": { value: "food category", link: "category" },
  "available rooms": { value: "available rooms", link: "rooms" },
  "cancelled booking": { value: "cancelled booking", link: "booking-record" },
};
const search = (req, res) => {
  try {
    const { word } = req.body;
    let found = false;
    const results = {};

    // Searching for the word in dataObject values
    for (const key in dataObject) {
      if (dataObject[key].value.indexOf(word) !== -1) {
        found = true;
        results[key] = dataObject[key];
      }
    }

    // Sending response based on search result
    if (found) {
      res.json({ status: true, message: "Word found in data", results });
    } else {
      res
        .status(404)
        .json({ status: false, message: "Word not found in data" });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//last invoice num
const lastInvoiceno = async (req, res, next) => {
  try {
    const lastInvoice = await prisma.roomservicemaster.findFirst({
      select: {
        invoice_num: true,
      },
      orderBy: {
        invoice_num: "desc",
      },
    });

    let nextInvoiceNum = lastInvoice ? lastInvoice.invoice_num + 1 : 1;
    res.status(200).json({
      status: true,
      message: "Data fetched successfully!",
      nextInvoiceNum,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
};

//logs api
//view all logs
const getalllogs = async (req, res, next) => {
  try {
    const count = await prisma.logmaster.count();

    if (count === 0) {
      res.status(404).json({ status: false, message: "data not found" });
    } else {
      const result = await prisma.logmaster.findMany({
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

//all logs by date
const logsbydate = async (req, res, next) => {
  try {
    let { from, to } = req.body;
    from = new Date(from);
    to = new Date(to);
    const count = await prisma.logmaster.count();

    if (count === 0) {
      res.status(404).json({ status: false, message: "data not found" });
    } else {
      const result = await prisma.logmaster.findMany({
        where: {
          datetime: {
            gte: from,
            lte: to,
          },
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

module.exports = {
  dashboardDetails,
  getBarChatData,
  getPieChatData,
  uploadImages,
  search,
  lastInvoiceno,
  getalllogs,
  logsbydate,
};
