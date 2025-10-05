const {prisma} = require("../../models/connection");
const logger = require("../../utils/logger");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const NodeCache = require("node-cache");
const {default: id} = require("date-and-time/locale/id");
const {exist} = require("joi");
const {error} = require("winston");
const myCache = new NodeCache();
const imagePath = "https://api.hotel.msquaretec.com";

const getAllBookingRoom = async (req, res, next) => {
  try {
    const {userDetails} = req.headers;
    const count = await prisma.reservationmaster.count({
      where: {vendor_user_id: userDetails.id},
    });
    // console.log(":::::::::::::", count, userDetails);

    if (count === 0) {
      return res.status(404).json({status: false, message: "data not found"});
    }

    const result = await prisma.reservationmaster.findMany({
      where: {vendor_user_id: userDetails.id},
      orderBy: {id: "desc"},
      include: {
        roommaster: {
          select: {
            title: true,
            floor_no: true,
            perdayprice: true,
          },
        },
        user_reservation_master: {
          select: {
            arrived_from: true,
            destination: true,
            mode_of_transport: true,
            purpose_of_visit: true,
            guestmaster: {
              select: {
                address: true,
                created_at: true,
                document: true,
                document_images: true,
                email: true,
                fullname: true,
                gender: true,
                nationality: true,
                phone_number: true,
              },
            },
            company_master: {
              select: {
                company_gst: true,
                company_name: true,
              },
            },
          },
        },
        guestmaster: {
          select: {
            address: true,
            created_at: true,
            document: true,
            document_images: true,
            email: true,
            fullname: true,
            gender: true,
            nationality: true,
            phone_number: true,
          },
        },
      },
    });

    result.forEach((item) => {
      const mainGuestCompanyDetails =
        item.user_reservation_master[0]?.company_master;

      item.mainGuest = {
        ...item.guestmaster,
        ...(mainGuestCompanyDetails && {
          company_name: mainGuestCompanyDetails.company_name,
          company_gst: mainGuestCompanyDetails.company_gst,
        }),
      };

      item.guests = item.user_reservation_master.map((i) => ({
        ...i.guestmaster,
        ...i.company_master,
      }));

      delete item.guestmaster;
      delete item.user_reservation_master;
      delete item.roomservicemaster;
    });

    return res.status(200).json({
      status: true,
      message: "data fetched successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({status: false, message: error.message});
  }
};

const getAllBookingRoomWithDate = async (req, res, next) => {
  try {
    const {from, to, criteria, roomId} = req.body;
    const {userDetails} = req.headers;

    const filters = [];

    if (criteria === "check_in") {
      filters.push({
        check_in: {
          gte: new Date(from).toISOString(),
          lte: new Date(to).toISOString(),
        },
      });
    }

    if (criteria === "check_out") {
      filters.push({
        check_out: {
          gte: new Date(from).toISOString(),
          lte: new Date(to).toISOString(),
        },
      });
    }

    if (criteria === "booking_date") {
      filters.push({
        booking_date: {
          gte: new Date(from).toISOString(),
          lte: new Date(to).toISOString(),
        },
      });
    }

    if (criteria === "departure_time") {
      filters.push({
        departure_time: {
          gte: new Date(from).toISOString(),
          lte: new Date(to).toISOString(),
        },
      });
    }

    if (criteria === "cancel_date") {
      filters.push({
        cancel_date: {
          gte: new Date(from).toISOString(),
          lte: new Date(to).toISOString(),
        },
      });
    }

    if (roomId) {
      filters.push({
        room_id: roomId,
      });
    }

    const result = await prisma.reservationmaster.findMany({
      where: {
        vendor_user_id: userDetails.id,
        AND: filters,
      },
      orderBy: {
        id: "desc",
      },
      include: {
        roommaster: {
          select: {
            title: true,
            floor_no: true,
            perdayprice: true,
            tax_type: true,
          },
        },
        user_reservation_master: {
          select: {
            arrived_from: true,
            destination: true,
            mode_of_transport: true,
            purpose_of_visit: true,
            guestmaster: {
              select: {
                address: true,
                created_at: true,
                document: true,
                document_images: true,
                email: true,
                fullname: true,
                gender: true,
                nationality: true,
                phone_number: true,
              },
            },
            company_master: {
              select: {
                company_gst: true,
                company_name: true,
              },
            },
          },
        },
        guestmaster: {
          select: {
            address: true,
            created_at: true,
            document: true,
            document_images: true,
            email: true,
            fullname: true,
            gender: true,
            nationality: true,
            phone_number: true,
          },
        },
        roomservicemaster: true,
      },
    });

    // Process result
    result.forEach((item) => {
      item.guests = item?.user_reservation_master.map((i) => ({
        ...i?.guestmaster,
        ...i?.company_master,
      }));
      item.guests = [item.guestmaster, ...item.guests];
      item.mainGuest = {...item.guestmaster};
      delete item.guestmaster;
      delete item.user_reservation_master;
    });

    res
      .status(200)
      .json({status: true, message: "Data fetched successfully", result});
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

const getAllBookingRoomByRoomId = async (req, res, next) => {
  try {
    const count = await prisma.reservationmaster.count();
    const id = +(await req.params.id);

    if (count === 0) {
      return res.status(404).json({status: false, message: "data not found"});
    }

    const result = await prisma.reservationmaster.findMany({
      orderBy: {
        id: "desc",
      },
      where: {
        room_id: id,
      },
      include: {
        roommaster: {
          select: {
            title: true,
            floor_no: true,
            perdayprice: true,
          },
        },
        user_reservation_master: {
          select: {
            arrived_from: true,
            destination: true,
            mode_of_transport: true,
            purpose_of_visit: true,
            guestmaster: {
              select: {
                address: true,
                created_at: true,
                document: true,
                document_images: true,
                email: true,
                fullname: true,
                gender: true,
                nationality: true,
                phone_number: true,
              },
            },
            company_master: {
              select: {
                company_gst: true,
                company_name: true,
              },
            },
          },
        },
        guestmaster: {
          select: {
            address: true,
            created_at: true,
            document: true,
            document_images: true,
            email: true,
            fullname: true,
            gender: true,
            nationality: true,
            phone_number: true,
          },
        },
      },
    });

    result.forEach((item) => {
      const mainGuestCompanyDetails =
        item.user_reservation_master[0]?.company_master;

      item.mainGuest = {
        ...item.guestmaster,
        ...(mainGuestCompanyDetails && {
          company_name: mainGuestCompanyDetails.company_name,
          company_gst: mainGuestCompanyDetails.company_gst,
        }),
      };

      item.guests = item.user_reservation_master.map((i) => ({
        ...i.guestmaster,
        ...i.company_master,
      }));

      delete item.guestmaster;
      delete item.user_reservation_master;
      delete item.roomservicemaster;
    });

    return res.status(200).json({
      status: true,
      message: "data fetched successfully",
      result,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({status: false, message: error.message});
  }
};

const getBookingRoom = async (req, res, next) => {
  try {
    const id = +(await req.params.id);

    const count = await prisma.reservationmaster.count({
      where: {
        id,
      },
    });
    if (count === 0) {
      res.status(404).json({status: false, message: "data not found"});
    } else {
      const result = await prisma.reservationmaster.findFirst({
        where: {
          id,
        },
        orderBy: {
          id: "desc",
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

const bookRoom = async (req, res) => {
  try {
    const {userDetails} = req.headers;
    let room_id = +req.params.id;
    req.body.booking_date = new Date(req.body.booking_date);
    req.body.check_in = new Date(req.body.check_in);
    req.body.check_out = new Date(req.body.check_out);

    let received_amount = +req.body.total_price - +req.body.remaining_amount;

    const imagesMap = {};
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file) => {
        const match = file.fieldname.match(
          /persons\[(\d+)\]\[document_images\]\[(\d+)\]/
        );
        if (match) {
          const personIndex = match[1];
          const imageKey = `persons${personIndex}document_images`;
          imagesMap[imageKey] = imagesMap[imageKey] || [];
          imagesMap[imageKey].push(file.filename);
        }
      });
    }

    const persons = req.body.persons.map((person, i) => ({
      ...person,
      document_images: imagesMap[`persons${i}document_images`] || [],
    }));

    let mainPerson = persons.shift();
    let userId;
    let companyId;

    // Function to create or retrieve company
    const getOrCreateCompany = async (company_name, company_gst) => {
      let existingCompany = await prisma.company_master.findFirst({
        where: {company_name, company_gst},
        select: {id: true},
      });

      if (!existingCompany) {
        existingCompany = await prisma.company_master.create({
          data: {company_name, company_gst},
          select: {id: true},
        });
      }

      return existingCompany.id;
    };

    // Create or retrieve company for the main person
    if (mainPerson?.company_name) {
      companyId = await getOrCreateCompany(
        mainPerson.company_name,
        mainPerson.company_gst
      );
    }

    // Create or update guest for the main person
    if (mainPerson?.user_id) {
      userId = +mainPerson.user_id;

      // Fetch existing document images
      const existingGuest = await prisma.guestmaster.findUnique({
        where: {id: +userId},
        select: {document_images: true},
      });

      // Combine existing images with new images
      const existingImages = existingGuest.document_images
        ? existingGuest.document_images.split(",")
        : [];
      const newImages = mainPerson.document_images || [];
      const allImages = existingImages.concat(newImages);

      // Update guest details if document and/or document images are provided
      await prisma.guestmaster.update({
        where: {id: userId},
        data: {
          document: mainPerson.document || existingGuest.document, // Update document if provided
          document_images: allImages.join(","),
        },
      });
      // if (existingGuest) {
      //   const existingImages = existingGuest.document_images
      //     ? existingGuest.document_images.split(",")
      //     : [];
      //   const newImages = mainPerson.document_images || [];
      //   const allImages = existingImages.concat(newImages);

      //   await prisma.guestmaster.update({
      //     where: {id: userId},
      //     data: {
      //       document: mainPerson.document || existingGuest.document,
      //       document_images: allImages.join(","),
      //     },
      //   });
      // }
    } else {
      const guestData = {
        role_id: 2,
        fullname: mainPerson.fullname,
        email: mainPerson.email,
        phone_number: mainPerson.phone_number,
        address: mainPerson.address,
        gender: mainPerson.gender,
        nationality: mainPerson.nationality,
        document: mainPerson.document || "", // Add document if provided
        document_images: mainPerson.document_images.join(",") || "",
      };

      const guest = await prisma.guestmaster.create({
        data: guestData,
        select: {id: true},
      });
      userId = guest.id;
    }

    let gst_status = [true, "true"].includes(req.body.gst_status)
      ? true
      : false;

    const booking = await prisma.reservationmaster.create({
      data: {
        check_in: req.body.check_in,
        check_out: req.body.check_out,
        booking_date: req.body.booking_date,
        total_days: +req.body.total_days,
        taxable_price: +req.body.taxable_price,
        cgst: +req.body.cgst,
        sgst: +req.body.sgst,
        igst: +req.body.igst,
        total_price: +req.body.total_price,
        adv_payment: +req.body.adv_payment,
        payment_status: req.body.payment_status,
        payment_type: req.body.payment_type,
        status: "BOOKED",
        discount: +req.body.discount,
        remaining_amount: +req.body.remaining_amount,
        received_amount: received_amount,
        invoice_num: null,
        room_id: room_id,
        user_id: +userId,
        gst_status: gst_status,
        vendor_user_id: userDetails.id,
        // after_discount_price: parseFloat(req.body.after_discount_price),
        perdayprice: parseFloat(req.body.perdayprice),
      },
    });

    await prisma.user_reservation_master.create({
      data: {
        guest_id: +userId,
        reservation_id: +booking.id,
        company_id: companyId || null,
        arrived_from: mainPerson.arrived_from || "",
        destination: mainPerson.destination || "",
        mode_of_transport: mainPerson.mode_of_transport || "",
        purpose_of_visit: mainPerson.purpose_of_visit || "",
      },
    });

    // Process each person and assign correct company ID
    for (let i = 0; i < persons.length; i++) {
      let person = persons[i];
      let personCompanyId;

      if (person.company_name) {
        personCompanyId = await getOrCreateCompany(
          person.company_name,
          person.company_gst
        );
      } else {
        personCompanyId = companyId || null; // Fallback to main person’s company ID if no company name is provided
      }

      const guest = await prisma.guestmaster.create({
        data: {
          role_id: 2,
          fullname: person.fullname,
          email: person.email,
          phone_number: person.phone_number,
          address: person.address,
          document: person.document,
          document_images: person.document_images.join(",") || "",
          nationality: person.nationality,
          gender: person.gender,
        },
        select: {id: true},
      });

      await prisma.user_reservation_master.create({
        data: {
          guest_id: guest.id,
          reservation_id: booking.id,
          company_id: personCompanyId,
          arrived_from: person.arrived_from || "",
          destination: person.destination || "",
          mode_of_transport: person.mode_of_transport || "",
          purpose_of_visit: person.purpose_of_visit || "",
        },
      });
    }

    await prisma.billingmaster.create({
      data: {
        invoice_num: null,
        company_gst: mainPerson.company_gst,
        company_name: mainPerson.company_name,
        guest_name: mainPerson.fullname,
        guest_email: mainPerson.email,
        invoice_date: booking.check_out,
        mobile_no: mainPerson.phone_number,
        reservation_id: +booking.id,
      },
    });

    res.status(200).json({
      status: true,
      message: "Booking done successfully!",
    });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({status: false, message: error.message});
  }
};

// edit reservation
const editBookingRoom = async (req, res, next) => {
  try {
    let data = req.body;
    let reservation_id = parseInt(req.params.id, 10);

    // Convert fields to their correct types
    data.total_days = parseInt(data.total_days, 10);
    data.taxable_price = parseFloat(data.taxable_price);
    data.cgst = parseFloat(data.cgst);
    data.sgst = parseFloat(data.sgst);
    data.igst = parseFloat(data.igst);
    data.total_price = parseFloat(data.total_price);
    data.adv_payment = parseFloat(data.adv_payment);
    data.remaining_amount = parseFloat(data.remaining_amount);
    data.discount = parseFloat(data.discount);
    data.perdayprice = parseFloat(data.perdayprice);

    data.gst_status = [true, "true"].includes(data.gst_status) ? true : false;

    // data.after_discount_price = parseFloat(data.after_discount_price);

    // Convert date fields if they are valid
    const convertToDate = (dateString) => {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    };

    // data.arrival_time = convertToDate(data.arrival_time);
    data.booking_date = convertToDate(data.booking_date);
    data.check_in = convertToDate(data.check_in);
    data.check_out = convertToDate(data.check_out);
    data.departure_time = null;
    // console.log("data", data);
    // Ensure none of the date fields are null (indicating an invalid date)
    if (
      [
        // data.arrival_time,
        data.booking_date,
        data.check_in,
        data.check_out,
        // data.departure_time,
      ].includes(null)
    ) {
      return res
        .status(400)
        .json({status: false, message: "Invalid date provided."});
    }

    // Update reservation
    const result = await prisma.reservationmaster.update({
      data,
      where: {
        id: reservation_id,
      },
      include: {
        roommaster: true,
        guestmaster: true,
      },
    });

    res.status(200).json({
      status: true,
      message: "Booking updated successfully!",
      result,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

const deleteBookingRoom = async (req, res, next) => {
  try {
    const id = +(await req.params.id);
    const result = await prisma.reservationmaster.delete({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });
    res
      .status(200)
      .json({status: true, message: "booking deleted successfully", result});
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

// cancel reservation
const cancelRoom = async (req, res, next) => {
  try {
    let reservation_id = await +req.params.id;
    let date = new Date();

    const reservation = await prisma.reservationmaster.update({
      data: {
        status: "CANCELLED",
        cancel_date: date,
      },
      where: {
        id: reservation_id,
      },
      include: {
        roommaster: true,
        guestmaster: true,
      },
    });

    res.status(200).json({
      status: true,
      message: "Booking Cancelled!",
      reservation,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//update payment status
const paymentstatus = async (req, res, next) => {
  try {
    let reservationId = +req.params.id;

    let data = await prisma.reservationmaster.findFirst({
      where: {
        id: reservationId,
      },
      select: {
        total_price: true,
      },
    });

    if (!data && !data?.total_price) {
      res.status(400).json({
        status: false,
        message: "No reservation found for this invoice.",
      });
    }

    const reservation = await prisma.reservationmaster.update({
      data: {
        payment_status: "PAID",
        status: "COMPLETED",
        remaining_amount: 0,
        received_amount: +data.total_price,
      },
      where: {
        id: reservationId,
      },
      select: {
        id: true,
        payment_status: true,
      },
    });
    let date = new Date();
    const billing = await prisma.billingmaster.update({
      data: {
        invoice_date: date,
      },
      where: {
        reservation_id: reservationId,
      },
      select: {
        invoice_date: true,
        invoice_num: true,
      },
    });
    res.status(200).json({
      status: true,
      message: "Payment status updated successfully",
      reservation,
      billing,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};

//upload bluck reservation
const addbookingbyexcel = async (req, res) => {
  try {
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

    // Assuming each row in the Excel file represents one booking, extract the relevant data
    const bookings = data.map((row) => {
      const persons = [];
      let personIndex = 0;

      // Dynamically handle multiple persons if present
      while (row[`person${personIndex}_fullname`]) {
        persons.push({
          fullname: row[`person${personIndex}_fullname`],
          email: row[`person${personIndex}_email`],
          phone_number: row[`person${personIndex}_phone_number`],
          address: row[`person${personIndex}_address`],
          gender: row[`person${personIndex}_gender`],
          nationality: row[`person${personIndex}_nationality`],
          document: row[`person${personIndex}_document`],
          document_images: row[`person${personIndex}_document_images`]
            ? row[`person${personIndex}_document_images`].split(",")
            : [],
          company_name: row[`person${personIndex}_company_name`],
          company_gst: row[`person${personIndex}_company_gst`],
          arrived_from: row[`person${personIndex}_arrived_from`],
          destination: row[`person${personIndex}_destination`],
          mode_of_transport: row[`person${personIndex}_mode_of_transport`],
          purpose_of_visit: row[`person${personIndex}_purpose_of_visit`],
          user_id: row[`person${personIndex}_user_id`],
        });
        personIndex++;
      }

      return {
        booking_date: new Date(row.booking_date),
        check_in: new Date(row.check_in),
        check_out: new Date(row.check_out),
        total_days: +row.total_days,
        taxable_price: +row.taxable_price,
        cgst: +row.cgst,
        sgst: +row.sgst,
        igst: +row.igst,
        total_price: +row.total_price,
        adv_payment: +row.adv_payment,
        payment_status: row.payment_status,
        payment_type: row.payment_type,
        discount: +row.discount,
        remaining_amount: +row.remaining_amount,
        received_amount: +row.total_price - +row.remaining_amount,
        // after_discount_price: parseFloat(row.after_discount_price),
        perdayprice: parseFloat(row.perdayprice),
        room_id: +row.room_id,
        persons,
      };
    });

    // Iterate over each booking in the JSON data and insert into the database
    for (const bookingData of bookings) {
      let {persons, ...bookingDetails} = bookingData;

      const lastInvoice = await prisma.reservationmaster.findFirst({
        select: {invoice_num: true},
        orderBy: {id: "desc"},
      });

      let nextInvoiceNum = lastInvoice ? lastInvoice.invoice_num + 1 : 1;
      bookingDetails.invoice_num = nextInvoiceNum;

      // Handle the main person separately
      let mainPerson = persons.shift();
      let userId;
      let companyId;

      const getOrCreateCompany = async (company_name, company_gst) => {
        let existingCompany = await prisma.company_master.findFirst({
          where: {company_name, company_gst},
          select: {id: true},
        });

        if (!existingCompany) {
          existingCompany = await prisma.company_master.create({
            data: {company_name, company_gst},
            select: {id: true},
          });
        }

        return existingCompany.id;
      };

      if (mainPerson?.company_name) {
        companyId = await getOrCreateCompany(
          mainPerson.company_name,
          mainPerson.company_gst
        );
      }

      if (mainPerson?.user_id) {
        userId = +mainPerson.user_id;

        const existingGuest = await prisma.guestmaster.findUnique({
          where: {id: +userId},
          select: {document_images: true},
        });

        const existingImages = existingGuest.document_images
          ? existingGuest.document_images.split(",")
          : [];
        const newImages = mainPerson.document_images || [];
        const allImages = existingImages.concat(newImages);

        await prisma.guestmaster.update({
          where: {id: userId},
          data: {
            document: mainPerson.document || existingGuest.document,
            document_images: allImages.join(","),
          },
        });
      } else {
        const guestData = {
          role_id: 2,
          fullname: mainPerson.fullname,
          email: mainPerson.email,
          phone_number: mainPerson.phone_number,
          address: mainPerson.address,
          gender: mainPerson.gender,
          nationality: mainPerson.nationality,
          document: mainPerson.document || "",
          // document_images: mainPerson.document_images.join(",") || "",
        };

        const guest = await prisma.guestmaster.create({
          data: guestData,
          select: {id: true},
        });
        userId = guest.id;
      }

      const booking = await prisma.reservationmaster.create({
        data: {
          ...bookingDetails,
          user_id: userId,
        },
      });

      await prisma.user_reservation_master.create({
        data: {
          guest_id: userId,
          reservation_id: booking.id,
          company_id: companyId || null,
          arrived_from: mainPerson.arrived_from || "",
          destination: mainPerson.destination || "",
          mode_of_transport: mainPerson.mode_of_transport || "",
          purpose_of_visit: mainPerson.purpose_of_visit || "",
        },
      });

      for (let i = 0; i < persons.length; i++) {
        let person = persons[i];
        let personCompanyId;

        if (person.company_name) {
          personCompanyId = await getOrCreateCompany(
            person.company_name,
            person.company_gst
          );
        } else {
          personCompanyId = companyId || null;
        }

        const guest = await prisma.guestmaster.create({
          data: {
            role_id: 2,
            fullname: person.fullname,
            email: person.email,
            phone_number: person.phone_number,
            address: person.address,
            document: person.document,
            document_images: person.document_images.join(",") || "",
            nationality: person.nationality,
            gender: person.gender,
          },
          select: {id: true},
        });

        await prisma.user_reservation_master.create({
          data: {
            guest_id: guest.id,
            reservation_id: booking.id,
            company_id: personCompanyId,
            arrived_from: person.arrived_from || "",
            destination: person.destination || "",
            mode_of_transport: person.mode_of_transport || "",
            purpose_of_visit: person.purpose_of_visit || "",
          },
        });
      }
    }

    res.status(200).json({
      status: true,
      message: "Booking inserted successfully!",
    });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({status: false, message: error.message});
  }
};

//edit booking
const editbilling = async (req, res, next) => {
  try {
    let {
      company_gst,
      company_name,
      fullname,
      invoice_date,
      phone_number,
      invoice_num,
      email,
      ...data
    } = req.body;

    data.total_days = parseInt(data.total_days, 10);
    data.taxable_price = parseFloat(data.taxable_price);
    data.cgst = parseFloat(data.cgst);
    data.sgst = parseFloat(data.sgst);
    data.igst = parseFloat(data.igst);
    data.total_price = parseFloat(data.total_price);
    data.adv_payment = parseFloat(data.adv_payment);
    data.remaining_amount = parseFloat(data.remaining_amount);
    data.discount = parseFloat(data.discount);
    data.perdayprice = parseFloat(data.perdayprice);

    data.gst_status = [true, "true"].includes(data.gst_status) ? true : false;
    // data.after_discount_price = parseFloat(data.after_discount_price);

    const convertToDate = (dateString) => {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    };

    // data.arrival_time = convertToDate(data.arrival_time);
    data.booking_date = convertToDate(data.booking_date);
    data.check_in = convertToDate(data.check_in);
    data.check_out = convertToDate(data.check_out);
    invoice_date = convertToDate(invoice_date);

    if (
      [
        // data.arrival_time,
        data.booking_date,
        data.check_in,
        data.check_out,
        invoice_date,
      ].includes(null)
    ) {
      return res
        .status(400)
        .json({status: false, message: "Invalid date provided."});
    }

    const billedit = await prisma.billingmaster.update({
      where: {
        id: +req.params.id,
      },
      data: {
        company_gst: company_gst,
        company_name: company_name,
        guest_name: fullname,
        invoice_date: invoice_date,
        mobile_no: String(phone_number).toString(),
        invoice_num: invoice_num,
        guest_email: email,
      },
      select: {
        reservation_id: true,
      },
    });

    const reservation = await prisma.reservationmaster.findFirst({
      where: {
        id: billedit.reservation_id,
      },
      select: {
        id: true,
        user_id: true,
      },
    });

    const userreservation = await prisma.user_reservation_master.findFirst({
      where: {
        reservation_id: reservation.id,
        guest_id: reservation.user_id,
      },
      select: {
        id: true,
        company_id: true,
        guest_id: true,
      },
    });

    let existingCompany = await prisma.company_master.findFirst({
      where: {company_gst},
      select: {id: true},
    });

    if (company_gst && company_name) {
      if (!existingCompany) {
        await prisma.company_master.create({
          data: {
            company_name: company_name,
            company_gst: company_gst,
          },
          select: {
            id: true,
          },
        });
      } else {
        let companyId = await prisma.company_master.update({
          where: {
            id: existingCompany?.id,
          },
          data: {
            company_name: company_name,
            company_gst: company_gst,
          },
        });

        await prisma.user_reservation_master.update({
          where: {
            id: userreservation.id,
          },
          data: {
            company_id: +companyId.id,
          },
        });
      }
    }

    await prisma.reservationmaster.update({
      where: {
        id: reservation.id,
      },
      data: {
        invoice_num: invoice_num,
        ...data,
      },
    });

    await prisma.guestmaster.update({
      where: {
        id: reservation.user_id,
      },
      data: {
        fullname: fullname,
        phone_number: phone_number,
        email: email,
      },
    });

    res.status(200).json({
      status: true,
      message: "Booking and related details updated successfully!",
      billedit,
    });
  } catch (error) {
    console.error("Error: ", error);
    logger.error(error);
    res.status(500).json({status: false, message: error.message});
  }
};
//

//reservation last invoice
const lastInvoicenum = async (req, res, next) => {
  try {
    const lastInvoice = await prisma.reservationmaster.findFirst({
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
    res.status(500).json({status: false, message: error.message});
  }
};

module.exports = {
  bookRoom,
  cancelRoom,
  editBookingRoom,
  getAllBookingRoom,
  getAllBookingRoomByRoomId,
  getBookingRoom,
  deleteBookingRoom,
  paymentstatus,
  getAllBookingRoomWithDate,
  addbookingbyexcel,
  editbilling,
  lastInvoicenum,
};
