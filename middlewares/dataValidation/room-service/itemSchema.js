const Joi = require("joi").extend(require("@joi/date"));
const { validateRequest } = require("../../valid");

// emi_management Schema
const roomServiceItemSchema = async (req, res, next) => {
  const schema = Joi.object({
    item_id: Joi.number().integer().positive(),
    service_id: Joi.number().integer().positive(),
    quantity: Joi.number().integer().positive(),
    price: Joi.number(),
    cgst: Joi.number(),
    sgst: Joi.number(),
    igst: Joi.number(),
    total: Joi.number(),
    invoice_num: Joi.number(),
  });

  await validateRequest(req, next, schema);
};

module.exports = { roomServiceItemSchema };
