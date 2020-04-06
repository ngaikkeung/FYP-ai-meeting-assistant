require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const indexRouter = require('./routers/index');
const uploadRouter = require('./routers/upload');
const activeRouter = require('./routers/active');
const webhookRouter = require('./routers/webhook');
const errorRouter = require('./routers/error');

// Set view engine
app.set('view engine', 'ejs');

// Set public folder to static folder
app.use('/public/', express.static('./public'))

// Parse request body to object
app.use(express.json());

// Apply router
app.use('/', indexRouter);
app.use('/active', activeRouter);
app.use('/upload', uploadRouter);
app.use('/webhook', webhookRouter);
app.use('/*', errorRouter);

app.listen(process.env.PORT, () => console.log(`app is running at port ${process.env.PORT}...`));