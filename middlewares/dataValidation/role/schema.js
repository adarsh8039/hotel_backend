const Joi = require("joi").extend(require("@joi/date"));
const {validateRequest} = require("../../../middlewares/valid");

const roleSchema = async (req, res, next) => {
  const schema = Joi.object({
    role: Joi.string().valid("Admin", "User", "Vendor"),
  });
  await validateRequest(req, next, schema);
};

module.exports = {roleSchema};
