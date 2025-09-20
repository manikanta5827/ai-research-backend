const { createLogger, transports, format } = require('winston');
const path = require('path');
const fs = require('fs');

let logDir = "logs";

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const customFormat = format.printf(({level, message, timestamp}) => {
    return `${timestamp} [${level.toUpperCase()}] ${message}`;
})

const logger = createLogger({
  levels,
  level: 'info',
  format: format.combine(
    format.timestamp(),
    customFormat
  ),
  transports: [
    new transports.File({ filename: path.join(logDir, 'app.log') })
  ],
});

module.exports = logger;