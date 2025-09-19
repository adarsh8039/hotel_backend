const Joi = require('joi').extend(require('@joi/date'));
const { validateRequest } = require('../../validation')

// login schema
const loginSchema = async (req, res, next) => {
  let schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });
  await validateRequest(req, next, schema);
}

module.exports = { loginSchema };