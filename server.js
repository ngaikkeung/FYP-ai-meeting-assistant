const express = require('express');
const server = express();
const router = require('./router');

// Set view engine
server.set('view engine', 'ejs');

// Set public folder to static folder
server.use('/public/', express.static('./public'))
    .use(router);


server.listen(3000, () => console.log('Server is running at port 3000...'));