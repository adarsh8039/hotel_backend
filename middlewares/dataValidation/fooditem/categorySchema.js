const Joi = require("joi").extend(require("@joi/date"));
const { validateRequest } = require("../../valid");

// emi_management Schema
const categorySchema = async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim(),
  });

  await validateRequest(req, next, schema);
};

module.exports = { categorySchema };
