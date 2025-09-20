const logger = require('../utils/winstonLogger.js');
const { parse  } = require('stack-trace');
const path = require('path');

const errorHandler = (err, req,res, next) => {
    let errorMessage = err.message;
    const stackFrames = parse(err); 

    if(stackFrames[0]) {
        let fileName = path.basename(stackFrames[0].getFileName() ?? 'fileNotfound');
        let lineNumber = stackFrames[0].getLineNumber();
        let functionName = stackFrames[0].getFunctionName();

        let logMessage = `[CRITICAL]: Error happened in file::${fileName} Line::${lineNumber} FunctionName::${functionName} Message::${errorMessage}`;

        logger.warn(logMessage);
    }

    if(errorMessage.includes("Can't reach database server")) {
        errorMessage = "Database connection failed. Please verify that your database server is running and accessible."
    }
    res.status(500).send({
        status: "error",
        message: 'Something went wrong!',
        error: errorMessage
    });
}

module.exports = errorHandler;