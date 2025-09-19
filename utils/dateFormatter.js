let {
  add,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachDayOfInterval,
} = require("date-fns");
const logger = require("../utils/logger");

function getFormat(date) {
  try {
    let data = date.split("-");

    return `${data[1]}-${data[0]}-${data[2]}`;
  } catch (error) {
    console.error(error);
    logger.error(error);
  }
}

function generateMonths(year) {
  try {
    const months = [];

    for (let month = 0; month < 12; month++) {
      months.push(new Date(year, month, 1));
    }

    return months;
  } catch (error) {
    console.error(error);
    logger.error(error);
    throw new Error("Failed to generate months");
  }
}

function convertToIndianStandard(date) {
  try {
    return add(date, {
      hours: 5,
      minutes: 30,
    });
  } catch (error) {
    console.error(error);
    logger.error(error);
  }
}

function getDateRange(startDate, endDate, criteria = "year") {
  try {
    // Parse input dates
    let start = new Date(startDate);
    let end = new Date(endDate);
    let range;

    // Get array of all months within the interval
    switch (criteria) {
      case "year":
        range = eachMonthOfInterval({ start, end });
        break;

      case "month":
        range = eachWeekOfInterval({ start, end });
        break;

      case "week":
        range = eachDayOfInterval({ start, end });
        break;

      default:
        console.log("invalid value provided");
        break;
    }

    return range;
  } catch (error) {
    console.error(error);
    logger.error(error);
  }
}

module.exports = {
  getFormat,
  generateMonths,
  convertToIndianStandard,
  getDateRange,
};
