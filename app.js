const path = require('path');
const express = require('express');
const morgan = require('morgan');
const fileRouter = require('./routes/files');
const bodyParser = require("body-parser");
const busboy = require("connect-busboy");

///routers to be added here 

const app = express();
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.use(express.json());
app.use(bodyParser.json({limit: "50mb"}));
//app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(busboy({
    highWaterMark: 2 * 1024 * 1024, 
}));
app.get('/',(req,res) => {
    res.send('this is working');
})
app.use('/fileService/upload/',fileRouter);


module.exports = app;  