const Joi = require("joi").extend(require("@joi/date"));
const { validateRequest } = require("../../valid");

// emi_management Schema
const roomServiceSchema = async (req, res, next) => {
  const schema = Joi.object({
    // room_id: Joi.number().integer().positive(),
    // reservation_id: Joi.number().integer().positive(),
    order_date: Joi.date(),
    sub_total: Joi.number(),
    // cgst: Joi.number(),
    // sgst: Joi.number(),
    // igst: Joi.number(),
    discount: Joi.number(),
    total: Joi.number(),
    service_items: Joi.array()
      .items(
        Joi.object({
          item_name: Joi.string(),
          service_id: Joi.number().integer().positive(),
          quantity: Joi.number().integer().positive(),
          price: Joi.number(),
          // cgst: Joi.number(),
          // sgst: Joi.number(),
          // igst: Joi.number(),
          // total: Joi.number(),
        })
      )
      .min(1),
  });
  await validateRequest(req, next, schema);
};

module.exports = { roomServiceSchema };
