const Joi = require("joi"); //.extend(require('@joi/date'));
const { validateRequest } = require("../../valid");

const guestSchema = async (req, res, next) => {
  const schema = Joi.object({
    role_id: Joi.number().integer().positive(),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    phone_number: Joi.string()
      .trim()
      .regex(/^\d{10}$/)
      .required(),
    address: Joi.string().required(),
    password: Joi.string().allow(null),
    username: Joi.string().required(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'CHILD'),
    nationality: Joi.string(),
  });
  await validateRequest(req, next, schema);
};

module.exports = { guestSchema };
