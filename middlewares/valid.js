const logger = require("../utils/logger");

const validateRequest = async (req, next, schema) => {
  try {
    let data = await req.body;
    if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
      let error = new Error(`Invalid or empty JSON object`);
      error.status = 400;
      return next(error);
    } else {
      const options = {
        abortEarly: false, // include all errors
        allowUnknown: true, // ignore unknown props
        // stripUnknown: true, // remove unknown props
      };
      const { error, value } = schema.validate(req.body, options);
      if (error) {
        let error = new Error(
          `Validation error: ${error.details.map((x) => x.message).join(", ")}`
        );
        error.status = 400;
        return next(error);
      } else {
        req.body = value;
        next();
      }
    }
  } catch (error) {
    console.error(error);
    logger.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

module.exports = { validateRequest };
