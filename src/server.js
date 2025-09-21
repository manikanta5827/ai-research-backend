const express = require('express');
const app = express();
const morgan = require('morgan');
const reqStack = require('request-stack');
const cors = require('cors');
const { logMiddleware } = require('./utils/winstonLogger.js');
const errorHandler = require('./middleware/errorHandler.js');
const appRoutes = require('./routes/appRoutes.js');
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(reqStack);
app.use(logMiddleware);

app.get('/', (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
});

//router
app.use('/', appRoutes);

//error handle
app.use(errorHandler);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log('HTTP server listening on port...', PORT);
})