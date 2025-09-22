const { createLogger, transports, format } = require('winston');
const path = require('path');
const fs = require('fs');

let logDir = path.join(process.cwd(), "logs");

try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    console.log(`created logs directory: ${logDir}`);
  }
} catch (error) {
  console.error(`failed to create logs directory: ${error.message}`);
  logDir = path.join(process.cwd(), "temp_logs");
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
      console.log(`created fallback logs directory: ${logDir}`);
    }
  } catch (fallbackError) {
    console.error(`failed to create fallback logs directory: ${fallbackError.message}`);
    logDir = require('os').tmpdir();
    console.log(`using system temp directory for logs: ${logDir}`);
  }
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const customFormat = format.printf(({ level, message, timestamp }) => {
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
    new transports.File({ filename: path.join(logDir, 'app.log') }),
    new transports.Console()
  ],
});

logger.info(`Winston logger initialized. Log directory: ${logDir}`);

const logMiddleware = (req, res, next) => {
  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedTimeInMs.toFixed(2)}ms`;

    if (res.statusCode >= 400) {
      logger.error(logMessage);
    } else {
      logger.info(logMessage);
    }
  });

  next();
};

module.exports = { logger, logMiddleware };