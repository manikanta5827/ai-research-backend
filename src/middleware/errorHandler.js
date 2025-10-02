const { logger } = require('../utils/winstonLogger.js');
const path = require('path');

const notFoundRoute = (req, res) => {
    return res.status(404).json({
        status: "error",
        message: "route not found"
    })
}


const errorHandler = (err, req, res, next) => {
    let errorMessage = err.message;

    const stack = err.stack;
    if (stack) {
        const stackLines = stack.split('\n');
        if (stackLines.length > 1) {
            const firstFrame = stackLines[1].trim();
            const match = firstFrame.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) ||
                firstFrame.match(/at\s+(.+?):(\d+):(\d+)/);

            if (match) {
                const functionName = match[1] || 'anonymous';
                const fileName = path.basename(match[2] || 'unknown');
                const lineNumber = match[3] || 'unknown';

                const logMessage = `[CRITICAL]: Error happened in file::${fileName} Line::${lineNumber} FunctionName::${functionName} Message::${errorMessage}`;
                logger.warn(logMessage);
            } else {
                logger.warn(`[CRITICAL]: Error occurred - ${errorMessage}`);
            }
        } else {
            logger.warn(`[CRITICAL]: Error occurred - ${errorMessage}`);
        }
    } else {
        logger.warn(`[CRITICAL]: Error occurred - ${errorMessage}`);
    }

    if (errorMessage.includes("Can't reach database server")) {
        errorMessage = "Database connection failed. Please verify that your database server is running and accessible."
    }
    res.status(500).send({
        status: "error",
        message: 'Something went wrong!',
        error: errorMessage
    });
}

module.exports = { notFoundRoute, errorHandler };