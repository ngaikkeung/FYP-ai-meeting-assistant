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


    // Depends on paramter number, search by different paramter
    if(payload.any && !payload.time && !payload.dateTime && !payload.number && !payload.datePeriod && !payload.address){
        DB.searchMinutesByAny(payload, (err, items) => {
            if(err){
                return response = "There are something wrong in database, please try later.";
            }
            if(items.length == 0){
                return response = "There are no result, please search again with others.";
            }
            for(let doc of items){
                response += "\n" + doc.title;
                response += "\n" + keywordsInDocumentContext(payload.any, doc)
                response += "\n";
            }
    
            return webhookReply(response, res);
        })
    }else if(payload.any && payload.dateTime){
        // Convert date to milliseconds;
        payload.dateTime = new Date(payload.dateTime).getTime();
        DB.searchMinutesByAnyAndDatetime(payload, (err, items) => {
            if(err){
                return response = "There are something wrong in database, please try later.";
            }
            if(items.length == 0){
                return response = "There are no result, please search again with others.";
            }
            for(let doc of items){
                response += "\n" + doc.title;
                response += "\n" + keywordsInDocumentContext(payload.any, doc)
                response += "\n";
            }
    
            return webhookReply(response, res);
        })
    }
    

    
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
    const PREFIX_OF_KEYWORD = 20;
    const SUFFIX_OF_KEYWORD = keyword.length + 20;
    let context = "";
    let positionOfKeyword = document.content.search(trimChar(keyword, '"'));
    let substringStartIndex = 0;

    // Prepare the context of keywords
    if(positionOfKeyword != -1){
        if(positionOfKeyword - PREFIX_OF_KEYWORD > 0){
            substringStartIndex = positionOfKeyword - PREFIX_OF_KEYWORD;
        }
        context = document.content.substring(substringStartIndex, positionOfKeyword + SUFFIX_OF_KEYWORD);
    }
    
    // Prepare the output showing
    if(context != ''){
        context = " ..." + context + " ...";
    }

    return context;
}

const trimChar = (string, charToRemove) => {
    if(string.charAt(0) == charToRemove) {
        string = string.substring(1);
    }

    if(string.charAt(string.length - 1) == charToRemove) {
        string = string.substring(0, string.length - 1);
    }

    return string;
}
