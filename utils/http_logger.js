const expressWinston = require('express-winston');
const winston = require('winston');
require('winston-daily-rotate-file');

const transport = new winston.transports.DailyRotateFile({
  filename: 'logs/http-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '7d',
});

const httpRequestLogger = expressWinston.logger({
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    // new winston.transports.File({ filename: 'logs/http.log' }),
    transport,
  ],
  format: winston.format.json(),
  meta: true, // optional: control whether you want to log the meta data about the request (default to true)
  expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
  ignoreRoute(req, res) { return false; }, // optional: allows to skip some log messages based on request and/or response
});

const httpErrorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    // new winston.transports.File({ filename: 'logs/http.log' }),
    transport,
  ],
  format: winston.format.json(),
  meta: true, // optional: control whether you want to log the meta data about the request (default to true)
  expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
  ignoreRoute(req, res) { return false; }, // optional: allows to skip some log messages based on request and/or response
});

module.exports = {
  httpRequestLogger,
  httpErrorLogger,
};
