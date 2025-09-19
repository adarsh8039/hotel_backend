const Joi = require("joi"); //.extend(require("@joi/date"));
const { validateRequest } = require("../../valid");

// emi_management Schema
const reservationSchema = async (req, res, next) => {
  const schema = Joi.object({
    room_id: Joi.number().integer().positive(),
    check_in: Joi.string().trim(),
    check_out: Joi.string().trim(),
    booking_date: Joi.date().max("now"),
    total_days: Joi.number().integer().positive(),
    taxable_price: Joi.number(),
    cgst: Joi.number(),
    sgst: Joi.number(),
    igst: Joi.number(),
    total_price: Joi.number(),
    adv_payment: Joi.number(),
    payment_type: Joi.string().trim(),
    payment_status: Joi.string().trim(),
    status: Joi.string().trim().valid("BOOKED", "CANCELLED"),
    purpose_of_visit: Joi.string(),
    destination: Joi.string(),
    arrived_from: Joi.string(),
  });
  await validateRequest(req, next, schema);
};

module.exports = { reservationSchema };
