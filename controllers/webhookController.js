const DB = new (require('./databaseController.js'))();

exports.handle = (req, res) => {
    console.log("Incoming webhook POST requset: ", req)

    console.log("webhook parameter: ", req.body.queryResult.parameters);
}

