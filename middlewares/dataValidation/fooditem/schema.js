const Joi = require("joi"); //.extend(require('@joi/date'));
const { validateRequest } = require("../../valid");

// sell_detail Schema
const foodSchema = async (req, res, next) => {
  const schema = Joi.object({
    item_name: Joi.string(),
    item_code: Joi.string(),
    price: Joi.string(),
    tax_type: Joi.string().trim().valid("INCLUDE", "EXCLUDE", "NONE"),
    category_id: Joi.number().integer().positive(),
  });
  await validateRequest(req, next, schema);
};

module.exports = { foodSchema };
