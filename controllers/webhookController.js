const DB = new (require('./databaseController.js'))();

exports.handle = (req, res) => {
    console.log("webhook parameter: ", req.body.queryResult.parameters);
    
    let response = "";
    let payload = {
        "dateTime": [],
        "time": req.body.queryResult.parameters.Time,
        "dateTime": req.body.queryResult.parameters["date-time"],
        "any": req.body.queryResult.parameters.any,
        "number": req.body.queryResult.parameters.number,
        "datePeriod": req.body.queryResult.parameters["date-period"],
        "address": req.body.queryResult.parameters.address,
        "searchingAction": []
    }
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
            response += keywordsInDocumentContext(payload.any, doc);
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

const keywordsInDocumentContext = (keyword, document) => {
    const PREFIX_OF_KEYWORD = SUFFIX_OF_KEYWORD = 20;
    let context = "";
    let positionOfKeyword = document.search(keyword);
    let substringStartIndex = 0;

    if(positionOfKeyword != -1){
        if(positionOfKeyword - PREFIX_OF_KEYWORD > 0){
            substringStartIndex = positionOfKeyword - PREFIX_OF_KEYWORD;
        }
        context = document.substring(substringStartIndex, positionOfKeyword + SUFFIX_OF_KEYWORD);
    }
    
    return context;
}
