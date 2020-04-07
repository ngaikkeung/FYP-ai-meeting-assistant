const DB = new (require('./databaseController.js'))();

exports.handle = (req, res) => {
    console.log("webhook parameter: ", req.body.queryResult.parameters);
    
    let response = "";
    let webhookResponse;
    let payload = {
        "dateTime": [],
        "time": req.body.queryResult.parameters.Time,
        "any": req.body.queryResult.parameters.any,
        "number": req.body.queryResult.parameters.number,
        "datePeriod": req.body.queryResult.parameters["date-period"],
        "address": req.body.queryResult.parameters.address,
        "searchingAction": []
    }
    payload.dateTime = req.body.queryResult.parameters["date-time"].length > 0 ? req.body.queryResult.parameters.date-time.slice() : [];
    payload.searchingAction = req.body.queryResult.parameters.searchingkeyword.length > 0 ? req.body.queryResult.parameters.searchingkeyword.slice() : [];

    DB.searchMinutes(payload, (err, items) => {
        if(err){
            return response = "There are something wrong in database, please try later.";
        }
        if(items.length == 0){
            return response = "There are no result, please search again with other keywords.";
        }
        for(let doc of items){
            response += " \n" + doc.title;
        }

        return webhookReply(response, res);
    })

    
}

const webhookReply = (response, res) => {
    // webhook response
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
