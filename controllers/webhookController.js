const DB = new (require('./databaseController.js'))();

exports.handle = (req, res) => {
    console.log("webhook parameter: ", req.body.queryResult.parameters);
    
    let response = "";
    let time, any, number, datePeriod, address;
    let dateTime = searchingAction = [];
    let webhookResponse;

    dateTime = req.body.queryResult.parameters["date-time"].length > 0 ? req.body.queryResult.parameters.date-time.slice() : [];
    time = req.body.queryResult.parameters.Time;
    any = req.body.queryResult.parameters.any;
    number = req.body.queryResult.parameters.number;
    datePeriod = req.body.queryResult.parameters["date-period"];
    address = req.body.queryResult.parameters.address;
    searchingAction = req.body.queryResult.parameters.searchingkeyword.length > 0 ? req.body.queryResult.parameters.searchingkeyword : [];


    response += "Date Time: " + dateTime;
    response += " Time: " + time;
    response += " Any: " + any;
    response += " Number: " + datePeriod;
    response += " Date Period: " + datePeriod;
    response += " Address: " + address;
    response += " Search action: " + searchingAction;

    webhookResponse = {
        "fulfillmentText": "", // Default response from webhook.
        "fulfillmentMessages": [
            {
                "text": {
                    "text": [response]
                }
            }
        ]
    };

    console.log("Webhook response: ", JSON.stringify(webhookResponse));
    return res.json(webhookResponse)
}

