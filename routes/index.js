const express = require("express");
const {
  upload,
  ChecImage,
  fileupload,
  Imageupload,
} = require("../models/multerSchema");
const router = express.Router();
// schemas
const {roleSchema} = require("../middlewares/dataValidation/role/schema");
const {guestSchema} = require("../middlewares/dataValidation/guest/schema");
const {roomSchema} = require("../middlewares/dataValidation/room/schema");
const {
  reservationSchema,
} = require("../middlewares/dataValidation/room/reservationSchema");
const {foodSchema} = require("../middlewares/dataValidation/fooditem/schema");
const {
  categorySchema,
} = require("../middlewares/dataValidation/fooditem/categorySchema");
const {
  roomServiceSchema,
} = require("../middlewares/dataValidation/room-service/schema");
const {
  roomServiceItemSchema,
} = require("../middlewares/dataValidation/room-service/itemSchema");
const {companySchema} = require("../middlewares/dataValidation/company/schema");
//controllers
const role = require("../controllers/role/index");
const fooditem = require("../controllers/fooditem/index");
const room = require("../controllers/room/index");
const guest = require("../controllers/guest/guest");
const booking = require("../controllers/room/booking");
const roomservice = require("../controllers/room-service/index");
const roomserviceitems = require("../controllers/room-service/items");
const dashboard = require("../controllers/dashboard/dashboard");
const billing = require("../controllers/reports/index");
const category = require("../controllers/fooditem/category");
const expenses = require("../controllers/expenses/index");
const company = require("../controllers/company/index");

/* ROLE ROUTE. */
router.get("/get/roles", role.getAllroles);
router.get("/role/:id", role.getrole);
router.post("/roles", [roleSchema], role.addrole);
router.put("/roles/:id", [roleSchema], role.editrole);
router.delete("/roles/:id", role.deleterole);

/* GUEST ROUTE. */
router.get("/all/guests", guest.viewguests);
router.get("/view/allguests", guest.allguests);
router.get("/view/specefic/guest/:id", guest.speceficguest);
router.post(
  "/add/new/guest",
  [upload.fields([{name: "image", maxCount: 1}, {name: "document_images"}])],
  guest.addguest
);
router.put(
  "/edit/guestdetails/:id",
  [upload.fields([{name: "image", maxCount: 1}, {name: "document_images"}])],
  guest.editguest
);
router.put("/update/profile", [upload.single("images")], guest.editprofile);
router.put("/update/privacy", guest.changeGuestPrivacy);
router.get("/get/privacy", guest.getGuestPrivacy);
router.delete("/delete/guest/:id", guest.disableguest);
router.post(
  "/addguest/byfile",
  fileupload.single("excelFile"),
  guest.addguestbyexcel
);
router.put("/update/privacypassword", guest.changePPassword);
router.post("/verify/privacypassword", guest.verifyPPassword);
router.post("/guest/bydate", guest.allguestswithdatefiltering);
router.post(
  "/update/invoice/images",
  [
    upload.fields([
      {name: "stamp_image", maxCount: 1},
      {name: "sign_image", maxCount: 1},
    ]),
  ],
  guest.editInvoiceStampAndSignImages
);

/* ROOM ROUTE. */
router.get("/get/speceficroom/:id", room.speceficroom);
router.get("/canceled/rooms", room.canceledrooms);
router.post("/add/rooms", [upload.array("images", 5)], room.addrooms);
router.post("/get/allrooms", room.allrooms);
router.put("/edit/roomdetails/:id", [upload.array("images", 5)], room.editroom);
// router.put("/edit/roomdetails/:id", [roomSchema], room.editroom);
router.delete("/delete/room/:id", room.deleteroom);
router.post("/booked/rooms", room.getBookedRoomsForService);
router.post("/check/room-no/rooms", room.checkRoomNoExists);
router.post(
  "/addrooms/byfile",
  fileupload.single("excelFile"),
  room.addroombyexcel
);
router.post("/rooms/update/disabled/:id", room.changeRoomDisabled);

/* FOOD-ITEM ROUTE. */
router.get("/getall/fooditems", fooditem.allfooditems);
router.post("/check/itemcode/fooditems", fooditem.checkItemCodeExists);
router.get("/getspecific/fooditem/:id", fooditem.speceficfooditem);
router.post("/add/fooditems", [upload.single("images")], fooditem.addfooditem);
router.put(
  "/edit/fooditem/:id",
  [upload.fields([{name: "images", maxCount: 1}])],
  fooditem.editfooditem
);
router.delete("/delete/fooditem/:id", fooditem.disablefooditem);
router.post(
  "/food-item/byfile",
  fileupload.single("excelFile"),
  fooditem.addfooditembyexcel
);

/* BOOKING ROUTE. */
router.post("/booking/:id", [Imageupload.any()], booking.bookRoom);
router.put(
  "/booking/edit/:id",
  [upload.fields([{name: "extra_person_doc", maxCount: 4}])],
  booking.editBookingRoom
);
router.put("/booking/cancel/:id", booking.cancelRoom);
router.post("/payment/status/update/:id", booking.paymentstatus);
router.post(
  "/booking/byfile",
  fileupload.single("excelFile"),
  booking.addbookingbyexcel
);
router.put("/edit/bill/:id", booking.editbilling);
router.get("/last/invoice", booking.lastInvoicenum);

/* RESERVATION ROUTE. */
router.get("/booking", booking.getAllBookingRoom);
router.post("/all/booking", booking.getAllBookingRoomWithDate);
router.get("/booking/by-id/:id", booking.getBookingRoom);
router.get("/booking/by-room/:id", booking.getAllBookingRoomByRoomId);
router.delete("/booking/:id", booking.deleteBookingRoom);

/* ROOM SERVICE ROUTE. */
router.get("/rooms/number", roomservice.roomnumbers);
router.get("/food/items", roomservice.fooditems);
router.get("/fooditem/price/:id", roomservice.foodprice);
router.get("/view/roomservice", roomservice.viewroomservice);
router.get("/view/roomservice/:id", roomservice.viewroomservicebyid);
router.get("/previous/day/roomservice", roomservice.previousdayroomservices);
router.get("/this/month/roomservice", roomservice.monthlyroomservice);
router.get("/weekly/roomservice", roomservice.weeklyroomservice);
router.get("/currentday/roomservice", roomservice.currentdayroomservice);
router.post("/roomservice", [roomServiceSchema], roomservice.roomservice);
router.put(
  "/edit/roomservice/:id",
  [roomServiceSchema],
  roomservice.editroomservice
);
router.get(
  "/roomservice/edit/payment-status/:ud",
  roomservice.editRoomServiceStatusPaid
);
router.delete("/delete/roomservice/:id", roomservice.deleteroomservice);
router.post("/update/payment/status/:id", roomservice.paymentstatus);
router.post("/roomservice/bydate", roomservice.viewroomservicebydate);

/* ROOM SERVICE ITEM ROUTE. */
router.get(
  "/roomservice/items/:id",
  roomserviceitems.getServiceItemsByServiceId
);
router.put(
  "/roomservice/items/edit/:id",
  [roomServiceItemSchema],
  roomserviceitems.editServiceItems
);
router.delete(
  "/roomservice/items/delete/:id",
  roomserviceitems.deleteServiceItems
);

/* DASHBOARD ROUTE. */
router.get("/dashboard", dashboard.dashboardDetails);
router.get("/dashboard/visitors", dashboard.getBarChatData);
router.get("/dashboard/roomSales", dashboard.getPieChatData);
// router.get("/totalrooms", dashboard.totalrooms);
// router.get("/monthly/totalrooms", dashboard.totalroomsmonthly);
// router.get("/yearly/totalrooms", dashboard.totalroomsyearly);
// router.get("/weekly/totalrooms", dashboard.totalRoomsWeekly);
// router.get("/bookedrooms", dashboard.bookedrooms);
// router.get("/monthly/bookedrooms", dashboard.bookedroomsmonthly);
// router.get("/yearly/bookedrooms", dashboard.bookedroomsyearly);
// router.get("/weekly/bookedrooms", dashboard.bookedroomsWeekly);
// router.get("/todayorder", dashboard.todayorder);
// router.get("/monthly/order", dashboard.monthlyOrder);
// router.get("/yearly/order", dashboard.yearlyOrder);
// router.get("/weekly/order", dashboard.weeklyOrder);
// router.get("/totalincome", dashboard.totalincome);
// router.get("/total/monthly/income", dashboard.totalMonthlyIncome);
// router.get("/total/yearly/income", dashboard.totalIncomeByYear);
// router.get("/weekly/total/income", dashboard.totalIncomeWeekly);
// router.get("/roomsales", dashboard.roomsales);
// router.get("/transactions", dashboard.transactions);
// router.get("/recent/orders", dashboard.recentOrders);
// router.get("/recent/booking", dashboard.recentbooking);
// router.get("/recent/checkins", dashboard.recentcheckins);

/* BILLING ROUTES */
router.post("/billing", billing.allbills);
router.get("/room/invoice/:id", billing.roominvoice);
router.get("/order/invoice/:id", billing.orderinvoice);
router.get("/order/room/invoice/:id", billing.completeInvoice);
router.post("/billing/bydate", billing.allbillsbydate);

/* FOOD CATEGORY ROUTES */
router.get("/category", category.getAllCategories);
router.get("/category/:id", category.getCategory);
router.post("/category", [categorySchema], category.addCategory);
router.put("/category/edit/:id", [categorySchema], category.editCategory);
router.delete("/category/delete/:id", category.deleteCategory);
router.post(
  "/category/byfile",
  fileupload.single("excelFile"),
  category.addCategorybyexcel
);

/* REPORTS ROUTES */
router.get("/bookedrooms/report", billing.bookedrooms);
router.post("/booked/room/report", billing.bookedroomswithdate);
router.get("/cancelrooms/report", billing.cancelrooms);
router.post("/cancel/room/report", billing.cancelroomswithdate);
router.get("/foodorder/report", billing.foodorder);
router.post("/food/order/report", billing.foodorderwithdate);
router.get("/user/report", billing.userreport);
router.post("/userreport", billing.userwithdate);
router.get("/all/bookings", billing.allbooking);
router.post("/all/booking/withdate", billing.bookingwithdate);
router.post("/bulk/update/paymentstatus/:id", billing.paymentstatus);
router.put("/update/gst/status/:id", billing.updateInvoiceGSTStatus);
router.put("/update/status/completed/:id", billing.updateInvoiceStatusComplete);
router.post("/get/guest/history", billing.guestHistorywithdate);
router.put("/cancel/checkout/:id", billing.canclecheckout);

//bulk images
router.post(
  "/upload-images",
  [upload.array("images", 10)],
  dashboard.uploadImages
);

//global search
router.post("/search/anything", dashboard.search);

//Expense routes
router.post("/expenses", expenses.addexpenses);
router.get("/expenses", expenses.getAllexpenses);
router.get("/expenses/:id", expenses.getexpense);
router.put("/expenses/edit/:id", expenses.editexpense);
router.delete("/expenses/delete/:id", expenses.disableexpenses);
router.post(
  "/expenses/byfile",
  fileupload.single("excelFile"),
  expenses.addexpensesbyexcel
);
router.post("/expenses/bydate", expenses.getAllexpensesbydate);

//extend checkout
router.post("/extend/checkout/:id/:roomid", room.extendcheckout);
router.post("/extend/checkout/:roomid", room.availablerooms);

//last invoice no
router.get("/last/invoiceno", dashboard.lastInvoiceno);

//existing invoice
router.post("/existing/invoice", roomservice.invoiceNum);

//company routes
router.post("/company", company.addCompany);
router.get("/company", company.allCompanies);
router.get("/company/:id", company.getCompany);
router.put("/company/edit/:id", company.editCompany);
router.delete("/company/delete/:id", company.disablecompany);
router.post(
  "/company/byfile",
  fileupload.single("excelFile"),
  company.addCompanybyexcel
);
router.post("/companies/bydate", company.allCompaniesbydate);
router.post("/verify/gst", company.gstnumber);

//logs
router.get("/all/logs", dashboard.getalllogs);
router.post("/logs/bydate", dashboard.logsbydate);

module.exports = router;
