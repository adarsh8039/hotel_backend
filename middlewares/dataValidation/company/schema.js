const Joi = require('joi').extend(require('@joi/date'));
const { validateRequest } = require('../../../middlewares/valid')

const companySchema = async (req, res, next) => {
  const schema = Joi.object({
    company_name: Joi.string(),
  });
 await validateRequest(req, next, schema);
}

module.exports = { companySchema }