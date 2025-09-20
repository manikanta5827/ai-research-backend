const express = require('express');
const app = express();
const morgan = require('morgan');
const reqStack = require('request-stack');
const errorHandler = require('./middleware/errorHandler.js');
const appRoutes = require('./routes/appRoutes.js');
require('dotenv').config();

// middleware
app.use(morgan('dev'));
app.use(reqStack);

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


const PORT = process.env.PORT || 3400;
app.listen(PORT,()=>{
    console.log('HTTP server listening on port...', PORT);
})