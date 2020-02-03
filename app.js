const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const indexRouter = require('./routers/index');
const uploadRouter = require('./routers/upload');
const activeRouter = require('./routers/active');


// Set view engine
app.set('view engine', 'ejs');

// Set public folder to static folder
app.use('/public/', express.static('./public'))

// Parse request body to object
app.use(bodyParser.urlencoded({extended:false}))

// Apply router
app.use('/', indexRouter);
app.use('/active', activeRouter);
app.use('/upload', uploadRouter);


app.listen(3000, () => console.log('app is running at port 3000...'));