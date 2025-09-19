const Joi = require("joi").extend(require("@joi/date"));
const { validateRequest } = require("../../valid");

// emi_management Schema
const roomSchema = async (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string(),
    floor_no: Joi.string(),
    bed_type: Joi.string(),
    facalities: Joi.string(),
    perdayprice: Joi.string(),
    description: Joi.string(),
    room_size: Joi.string().valid('Small','Big')
  });
  await validateRequest(req, next, schema);
};

module.exports = { roomSchema };
