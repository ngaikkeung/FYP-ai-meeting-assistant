const DB = new (require('./databaseController.js'))();

exports.handle = (req, res) => {
    console.log("webhook query result: ", req.body.queryResult);

    const intent = req.body.queryResult.intent.displayName
    const queryResult = req.body.queryResult

    /** Handle by different intent */
    switch(intent){
        case 'keywordSearch':
            keywordSearchHandler(queryResult, res);
            break;
        case 'locationSearch':
            break;
        case 'numberingSearch':
            break;
        case 'periodSearch':
            break;
        case 'dateSearch':
            break;
    }

    
}

const webhookReply = (responseText, httpResponse) => {
    // webhook response
    webhookResponse = {
        "fulfillmentText": "", // Default response from webhook.
        "fulfillmentMessages": [
            {
                "text": {
                    "text": [responseText]
                }
            }
        ]
    };

    console.log("Webhook response: ", JSON.stringify(webhookResponse));
    return httpResponse.json(webhookResponse)
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
    }else{
        context = "Not found keyword context in document : " + document.title
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

/** Intent handler */


const keywordSearchHandler = (queryResult, httpResponse) => {
    let keyword = queryResult.any ? queryResult.any : "";
    let textResponse = ""

    if(keyword){
        DB.searchMinutesByAnyKeyword(keyword, (err, results) => {
            if(err){
                return textResponse = "The are error occur in database."
            }
            if(results.length == 0){
                return textResponse = "There are no result, please search again."
            }

            for(let result of results){
                textResponse += "\n" + result.title
                textResponse += "\n" + keywordsInDocumentContext(keyword, result)
                textResponse += "\n"
            }

            return webhookReply(textResponse, httpResponse)
        })
    }
}