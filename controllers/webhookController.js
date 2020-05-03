const DB = new (require('./databaseController.js'))();

exports.handle = (req, res) => {
    const intent = req.body.queryResult.intent.displayName
    const queryResult = req.body.queryResult

    console.log("webhook query result: ", req.body.queryResult);
    console.log("Request intent: ", intent);

    /** Handle by different intent */
    switch(intent){
        case 'keywordSearch':
            keywordSearchHandler(queryResult, res);
            break;
        case 'locationSearch':
            keywordSearchHandler(queryResult, res)
            break;
        case 'numberingSearch':
            numberingSearchHandler(queryResult, res)
            break;
        case 'periodSearch':
            periodSearchHandler(queryResult, res)
            break;
        case 'dateSearch':
            dateSearchHandler(queryResult, res)
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
        context = "Not found keyword context in document."
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

const isEmptyObject = (obj) => {
    return Object.keys(obj).length === 0;
}

/** Intent handler */

const keywordSearchHandler = (queryResult, httpResponse) => {
    let keyword = queryResult.parameters.keyword ? queryResult.parameters.keyword : "";
    let textResponse = ""

    if(keyword){
        DB.searchMinutesByAnyKeyword(keyword, (err, results) => {
            if(err){
                return webhookReply(`The are error occur in database: ${err}`, httpResponse)
            }
            if(results.length == 0){
                return webhookReply("There are no result, please search again.", httpResponse)
            }

            for(let result of results){
                textResponse += result.title
                textResponse += "\n" + keywordsInDocumentContext(keyword, result)
                textResponse += "\n"
            }

            return webhookReply(textResponse, httpResponse)
        })
    }else{
        return webhookReply("No keyword detect in keywordSearchHandler", httpResponse);
    }
}

const numberingSearchHandler = (queryResult, httpResponse) => {
    // let keyword = queryResult.parameters.any ? queryResult.parameters.any : "";
    // let textResponse = ""

    // if(keyword){
    //     DB.searchMinutesByAnyKeyword(keyword, (err, results) => {
    //         if(err){
    //             return textResponse = "The are error occur in database."
    //         }
    //         if(results.length == 0){
    //             return textResponse = "There are no result, please search again."
    //         }

    //         for(let result of results){
    //             textResponse += result.title
    //             textResponse += "\n" + keywordsInDocumentContext(keyword, result)
    //             textResponse += "\n"
    //         }

    //         return webhookReply(textResponse, httpResponse)
    //     })
    // }
    return webhookReply("TO DO...", httpResponse)
}

const periodSearchHandler = (queryResult, httpResponse) => {
    let period = !isEmptyObject(queryResult.parameters["date-period"]) ?  queryResult.parameters["date-period"] : null; 
    let textResponse = ""

    if(period){
        DB.searchMinutesByPeiod(period, (err, results) => {
            if(err){
                return webhookReply(`The are error occur in database: ${err}`, httpResponse)
            }
            if(results.length == 0){
                return webhookReply("There are no result, please search again.", httpResponse)
            }

            for(let result of results){
                let minuteDate = `${new Date(result.date).getDate()}-${new Date(result.date).getMonth() + 1}-${new Date(result.date).getFullYear()}`

                textResponse += result.title
                textResponse += `\n Date: ${minuteDate}` 
                textResponse += "\n"
            }

            return webhookReply(textResponse, httpResponse)
        })
    }else{
        return webhookReply("No period detect in periodSearchHandler", httpResponse);
    }
}

const dateSearchHandler = (queryResult, httpResponse) => {
    let dateTime = queryResult.parameters["date-time"] ? queryResult.parameters["date-time"] : "";
    let textResponse = ""

    if(dateTime){
        if(typeof dateTime == 'string'){
            dateTime = {
                startDate: new Date(dateTime).getTime(),
                endDate: new Date(dateTime).getTime()
            }
        }

        DB.searchMinutesByPeiod(dateTime, (err, results) => {
            if(err){
                return webhookReply(`The are error occur in database: ${err}`, httpResponse)
            }
            if(results.length == 0){
                return webhookReply("There are no result, please search again.", httpResponse)
            }

            for(let result of results){
                let minuteDate = `${new Date(result.date).getDate()}-${new Date(result.date).getMonth() + 1}-${new Date(result.date).getFullYear()}`

                textResponse += result.title
                textResponse += `\n Date: ${minuteDate}` 
                textResponse += "\n"
            }

            return webhookReply(textResponse, httpResponse)
        })
    }else{
        return webhookReply("No date time detect in periodSearchHandler", httpResponse);
    }
}