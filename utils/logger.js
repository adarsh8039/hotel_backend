const winston = require('winston');
require('winston-daily-rotate-file');

const {
  combine, prettyPrint, simple, json, timestamp, errors, metadata,
} = winston.format;

const transport1 = new winston.transports.DailyRotateFile({
  level: 'error',
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

const transport2 = new winston.transports.DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

const logger = winston.createLogger({
  level: 'info',
  // format: winston.format.json(),
  format: combine(
    errors({ stack: true }),
    metadata(),
    timestamp(),
    json(),
  ),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
    transport1,
    transport2,
  ],
});

// if (process.env.NODE_ENV !== 'prod') {
logger.add(new winston.transports.Console({
  // format: winston.format.prettyPrint(),
  format: combine(simple(), prettyPrint()),
}));
// }
module.exports = logger;
