const DB = new (require('./databaseController.js'))();
const OS = require("os");
const hostname = OS.hostname();

let contexts = []

exports.getContexts = (req, res) => {
    return res.json(contexts)
}

exports.handle = (req, res) => {
    const intent = req.body.queryResult.intent.displayName
    const queryResult = req.body.queryResult

    console.log("webhook request: ", JSON.stringify(req.body));

    /** Handle by different intent */
    intentSwitchHandler(intent, queryResult, res)

    
}

const webhookReply = (responseText, httpResponse) => {
    let  webhookResponse = {
        "fulfillmentText": "", // Default response from webhook.
        "fulfillmentMessages": [
            {
                "text": {
                    "text": []
                }
            }
        ]
    };

    if(typeof responseText == 'string'){

       webhookResponse.fulfillmentMessages[0].text.text.push(responseText);
       
    }else if(typeof responseText == 'object' && responseText.length > 0){
        
        for(let value of responseText){
            webhookResponse.fulfillmentMessages[0].text.text.push(value);
        }
        
    }else{
        console.error("Webhook response text type Error.");
    }
    

    console.log("Webhook response: ", JSON.stringify(webhookResponse));
    return httpResponse.json(webhookResponse)
}

const webhookReplyToTriggerIntent = (eventName, httpResponse) => {
    // webhook response
    webhookResponse = {
        "followupEventInput" : {
            "name" : eventName,
        }
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

const updateConext = (intent, parameters, queryResult, userResponse, backendResponse) => {
    let contextData = {
        intent: null,
        parameters: null,
        queryResult: null,
        userResponse: null,
        backendResponse: null,
    };

    contextData.intent = intent;
    contextData.queryResult = queryResult;
    contextData.userResponse = userResponse;
    contextData.backendResponse = backendResponse;
    contextData.parameters = parameters

    contexts.push(contextData)
}

/** Intent handler */

const keywordSearchHandler = (queryResult, httpResponse, isSecondIntent) => {
    let keyword = queryResult.parameters.keyword ? queryResult.parameters.keyword : "";
    let textResponse = ""

    if(keyword){
        if(!isSecondIntent){
            DB.searchMinutesByAnyKeyword(keyword, (err, results) => {
                if(err){
                    return webhookReply(`There are error occur in database: ${err}`, httpResponse)
                }
    
                updateConext('keywordSearch', {
                        keyword: keyword
                    }, results.length, queryResult.queryText, textResponse)
    
                if(results.length == 0){
                    return webhookReply(`There are no result about \`${keyword}\`, please search with other keyword.`, httpResponse)
                }
                if(results.length > 1 && !(contexts.length > 2 && contexts[contexts.length - 2].intent == 'tooMuch - no') ){
                    textResponse = `${results.length} results was found. Do you want to narrow down result? (Yes / No)`
                    return webhookReply(textResponse, httpResponse)
                }
    
                textResponse = `The results are showing below page:
                                https://ai-fyp-meeting-emk.herokuapp.com/query?intent=keywordSearch&keyword=${keyword}`
    
                return webhookReply(textResponse, httpResponse)
            })
        }else{
            let keywords = [keyword, contexts[contexts.length - 2].parameters.keyword]

            DB.searchMinutesByTwoKeyword(keywords, (err, results) => {
                if(err){
                    return webhookReply(`There are error occur in database: ${err}`, httpResponse)
                }
    
                updateConext('keywordSearch', {
                        keyword: keywords
                    }, results.length, queryResult.queryText, textResponse)
    
                if(results.length == 0){
                    return webhookReply(`There are no result about \`${keyword}\`, please search with other keyword.`, httpResponse)
                }
    
                textResponse = `The results are showing below page:
                                https://ai-fyp-meeting-emk.herokuapp.com/query?intent=keywordSearch&keyword1=${keywords[0]}&keyword2=${keywords[1]}&isSecondIntent=1`
    
                return webhookReply(textResponse, httpResponse)
            })
        }
    }else{
        return webhookReply("No keyword detect in keywordSearchHandler", httpResponse);
    }
}

const addressSearchHandler = (queryResult, httpResponse, isSecondIntent) => {
    let address = queryResult.parameters.address ? queryResult.parameters.address : "";
    let textResponse = "";
    let textResponseArray = [];

    if(keyword){
        if(!isSecondIntent){
            DB.searchMinutesByAnyKeyword(address, (err, results) => {
                if(err){
                    return webhookReply(`The are error occur in database: ${err}`, httpResponse)
                }
    
                updateConext('locationSearch', {
                        address: address
                    }, results.length, queryResult.queryText, textResponse)
    
                if(results.length == 0){
                    return webhookReply(`There are no result about \`${address}\`, please search with other keyword.`, httpResponse)
                }
                
                if(results.length > 1 && !(contexts.length > 2 && contexts[contexts.length - 2].intent == 'tooMuch - no') ){
                    textResponse = `${results.length} results was found. Do you want to narrow down result? (Yes / No)`
                    return webhookReply(textResponse, httpResponse)
                }
    
                // textResponse = `${results} results was found. The results are showing below page:
                //                 https://ai-fyp-meeting-emk.herokuapp.com/query?intent=locationSearch&address=${address}`
                textResponseArray.push(`${results} results was found. The results are showing below page:`)
                textResponseArray.push(`https://ai-fyp-meeting-emk.herokuapp.com/query?intent=locationSearch&address=${address}`);
    
                return webhookReply(textResponseArray, httpResponse)
            })
        }else{
            let keywords = [address, queryResult.secondSearchParameters.keyword]

            DB.searchMinutesByTwoKeyword(keywords, (err, results) => {
                if(err){
                    return webhookReply(`There are error occur in database: ${err}`, httpResponse)
                }
    
                updateConext('keywordSearch', {
                        keyword: keywords
                    }, results.length, queryResult.queryText, textResponse)
    
                if(results.length == 0){
                    return webhookReply(`There are no result about \`${keyword}\`, please search with other keyword.`, httpResponse)
                }
    
                // textResponse = `The results are showing below page:
                //                 https://ai-fyp-meeting-emk.herokuapp.com/query?intent=keywordSearch&keyword1=${keywords[0]}&keyword2=${keywords[1]}&isSecondIntent=1`
                textResponseArray.push(`${results} results was found. The results are showing below page:`)
                textResponseArray.push(` https://ai-fyp-meeting-emk.herokuapp.com/query?intent=keywordSearch&keyword1=${keywords[0]}&keyword2=${keywords[1]}&isSecondIntent=1`);
                return webhookReply(textResponseArray, httpResponse)
            })
        }
    }else{
        return webhookReply("No address detect in keywordSearchHandler", httpResponse);
    }
}

const numberingSearchHandler = (queryResult, httpResponse) => {
    let payload = {
        timeWord: queryResult.parameters.time ? queryResult.parameters.time : "",
        number: queryResult.parameters.number ? queryResult.parameters.number : "",
    }
    let textResponse = ""

    DB.searchMinutesByNumberOfMeeting(payload, (err, results) => {
        if(err){
            return webhookReply(`The are error occur in database: ${err}`, httpResponse)
        }

        updateConext('numberingSearch', {
                time: payload.timeWord, 
                number: payload.number
            }, results.length, queryResult.queryText, textResponse)

        if(results.length == 0){
            return webhookReply(`There are no result , please search with again.`, httpResponse)
        }

        if(results.length > 1 && !(contexts.length > 2 && contexts[contexts.length - 2].intent == 'tooMuch - no') ){
            textResponse = `${results.length} results was found. Do you want to narrow down result?`
            return webhookReply(textResponse, httpResponse)
        }

        textResponse = `The results are showing below page:
                        https://ai-fyp-meeting-emk.herokuapp.com/query?intent=numberingSearch&time=${payload.timeWord}&number=${payload.number}`

        return webhookReply(textResponse, httpResponse)
    })    
}

const periodSearchHandler = (queryResult, httpResponse) => {
    let period = !isEmptyObject(queryResult.parameters["date-period"]) ?  queryResult.parameters["date-period"] : null; 
    let textResponse = ""

    if(period){
        DB.searchMinutesByPeiod(period, (err, results) => {
            if(err){
                return webhookReply(`The are error occur in database: ${err}`, httpResponse)
            }

            updateConext('periodSearch', {
                "date-period":{
                    startDate: period.startDate, 
                    endDate: period.endDate
                }
            }, results.length, queryResult.queryText, textResponse)

            if(results.length == 0){
                return webhookReply(`There are no result within the period \`${period.startDate} - ${period.endDate}\`, please search again.`, httpResponse)
            }

            if(results.length > 1 && !(contexts.length > 2 && contexts[contexts.length - 2].intent == 'tooMuch - no') ){
                textResponse = `${results.length} results was found. Do you want to narrow down result?`
                return webhookReply(textResponse, httpResponse)
            }

            textResponse = `The results are showing below page:
                            https://ai-fyp-meeting-emk.herokuapp.com/query?intent=periodSearch&startDate=${period.startDate}&endDate=${period.endDate}`

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

            updateConext('dateSearch', {
                "date-time":{
                    startDate: dateTime.startDate, 
                    endDate: dateTime.endDate
                }
            }, results.length, queryResult.queryText, textResponse)
            
            if(results.length == 0){
                return webhookReply(`There are no result within the period \`${startDate} - ${endDate}\`, please search again.`, httpResponse)
            }
            if(results.length > 1 && !(contexts.length > 2 && contexts[contexts.length - 2].intent == 'tooMuch - no') ){
                textResponse = `${results.length} results was found. Do you want to narrow down result?`
                return webhookReply(textResponse, httpResponse)
            }

            textResponse = `The results are showing below page:
                            https://ai-fyp-meeting-emk.herokuapp.com/query?intent=dateSearch&startDate=${period.startDate}&endDate=${period.endDate}`

            return webhookReply(textResponse, httpResponse)
        })
    }else{
        return webhookReply("No date time detect in periodSearchHandler", httpResponse);
    }
}

const keywordPeriodSearchHandler = (queryResult, httpResponse) => {
    let keyword = queryResult.parameters.keyword ? queryResult.parameters.keyword : "";
    let period = !isEmptyObject(queryResult.parameters["date-period"]) ?  queryResult.parameters["date-period"] : null; 
    let parameters = {
        keyword: keyword
    }
    let textResponse = ""

    if(keyword && period){
        let payload = {
            keyword: keyword,
            period: period
        }
        DB.searchMinutesByAnyKeywordPeriod(payload, (err, results) => {
            if(err){
                return webhookReply(`The are error occur in database: ${err}`, httpResponse)
            }

            updateConext('keyword-periodSearch', {
                    keyword: keyword, 
                    "date-time":{
                        startDate: dateTime.startDate, 
                        endDate: dateTime.endDate
                    }
            }, results.length, queryResult.queryText, textResponse)
            
            if(results.length == 0){
                return webhookReply("There are no result, please search again.", httpResponse)
                // return webhookReplyToTriggerIntent('KeywordSearch-NoResult' , httpResponse)
            }
          
            textResponse = `The results are showing below page:
                            https://ai-fyp-meeting-emk.herokuapp.com/query?intent=keyword-periodSearch&keyword=${keyword}&startDate=${period.startDate}&endDate=${period.endDate}`

            return webhookReply(textResponse, httpResponse)
        })
    }else{
        return webhookReply("No keyword detect in keywordPeriodSearchHandler", httpResponse);
    }
}

const keywordDatedSearchHandler = (queryResult, httpResponse) => {
    let keyword = queryResult.parameters.keyword ? queryResult.parameters.keyword : "";
    let dateTime = queryResult.parameters["date-time"] ? queryResult.parameters["date-time"] : "";
    let parameters = {
        keyword: keyword
    }
    let textResponse = ""

    if(keyword && period){
        if(typeof dateTime == 'string'){
            dateTime = {
                startDate: new Date(dateTime).getTime(),
                endDate: new Date(dateTime).getTime()
            }
        }
        let payload = {
            keyword: keyword,
            period: dateTime
        }

        DB.searchMinutesByAnyKeywordPeriod(payload, (err, results) => {
            if(err){
                return webhookReply(`The are error occur in database: ${err}`, httpResponse)
            }

            updateConext('keyword-DateSearch', {
                    keyword: keyword, 
                    "date-time": {
                        startDate: period.startDate, 
                        endDate: period.endDate
                    }
            }, results.length, queryResult.queryText, textResponse)

            if(results.length == 0){
                return webhookReply("There are no result, please search again.", httpResponse)
                // return webhookReplyToTriggerIntent('KeywordSearch-NoResult', httpResponse)
            }

            for(let result of results){
                textResponse += result.title
                textResponse += "\n" + keywordsInDocumentContext(keyword, result)
                textResponse += "\n"
            }

            return webhookReply(textResponse, httpResponse)
        })
    }else{
        return webhookReply("No keyword detect in keywordDateSearchHandler", httpResponse);
    }
}

const narrowDownHandler = (queryResult, httpResponse) => {
    if(contexts.length >= 2 && contexts[contexts.length - 1].intent == 'tooMuch - yes'){
        let keyword = queryResult.parameters.keyword ? queryResult.parameters.keyword : "";
        let textResponse = ""
        let previousIntent = contexts[contexts.length - 2].intent
        let previousParameter = contexts[contexts.length - 2].parameters

        console.log("Previous Intent: ", previousIntent);

       if(previousIntent){
            return seconIntentSwitchHandler(previousIntent, previousParameter, queryResult, httpResponse);
       }
    }

    return webhookReplyToTriggerIntent('backToWelcome', httpResponse);
}

const yesHandler = (queryResult, httpResponse) => {
    let intent = 'tooMuch - yes';
    let userResponse = queryResult.queryText;

    if(contexts.length > 0){
        let backendResponse = 'Please enter another keyword(s) for narrow down search.'
        updateConext(intent, null, null , userResponse, backendResponse)

        return webhookReply(backendResponse, httpResponse)
    }

    return webhookReplyToTriggerIntent('backToWelcome', httpResponse);
}

const noHandler = (queryResult, httpResponse) => {
    let intent = 'tooMuch - no';
    let userResponse = queryResult.queryText;

    // for(let i = contexts.length - 1; i >= 0; i--){
    //     if(intents.length == 2) 
    //         break;
    //     if(contexts[i].parameters){
    //         let intent = {
    //             intnet: contexts[i].intent,
    //             parameters: contexts[i].parameters
    //         }
    //         intents.push(intent);
    //     }
    // }

    // switch(intents[0].intent){
    //     case 'keywordSearch':
    //         switch(intents[1].intent){
    //             case 'locationSearch':
    //                 payload = [];
    //                 payload.push(intents[0].parameters.keyword)
    //                 payload.push(intents[1].parameters.address)

    //                 DB.searchMinutesByKeywordLocation(payload, (err, results) => {
    //                     if(err){
    //                         return webhookReply(`The are error occur in database: ${err}`, httpResponse)
    //                     }
    //                     if(results.length == 0){
    //                         return webhookReply("There are no result, please search again.", httpResponse)
    //                         // return webhookReplyToTriggerIntent('KeywordSearch-NoResult' , httpResponse)
    //                     }
            
    //                     for(let result of results){
    //                         textResponse += result.title
    //                         textResponse += "\n" + keywordsInDocumentContext(keyword, result)
    //                         textResponse += "\n"
    //                     }
            
    //                     return webhookReply(textResponse, httpResponse)
    //                 })
    //                 break;
    //             case 'dateSearch':
    //             case 'periodSearch':
    //                 return webhookReply("TO DO", httpResponse)
    //         }
    //         break;
    //     case 'locationSearch':

    //     return webhookReply("TO DO", httpResponse)
    // }
    
    if(contexts.length > 0){
        let previousIntent;

        updateConext(intent, null, null , userResponse, '')

        for(let i = contexts.length - 1; i >= 0; i--){
            if(contexts[i].parameters){
                previousIntent = {
                    name: contexts[i].intent,
                    parameters: contexts[i].parameters
                }
                break;
            }
        }
        console.log("No and returned intent: ", JSON.stringify(previousIntent));
        return intentSwitchHandler(previousIntent.name, previousIntent, httpResponse);
    }

    return webhookReplyToTriggerIntent('backToWelcome', httpResponse);
}

const resetContext = (queryResult, httpResponse) => {
    contexts = [];
    return webhookReplyToTriggerIntent('backToWelcome', httpResponse);
}

const intentSwitchHandler = (intent, queryResult, res) => {
    switch(intent){
        case 'keywordSearch':
            keywordSearchHandler(queryResult, res, false);
            break;
        case 'locationSearch':
            addressSearchHandler(queryResult, res)
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
        case 'keyword-periodSearch': 
            keywordPeriodSearchHandler(queryResult, res)
            break;
        case 'keyword-dateSearch':
            keywordDatedSearchHandler(queryResult, res)
            break;
        case 'tooMuch - yes':
            yesHandler(queryResult, res);
            break;
        case 'tooMuch - no':
            noHandler(queryResult, res)
            break;
        case 'narrowDown-keyword':
            narrowDownHandler(queryResult, res)
            break;
        case 'resetSearch':
            resetContext(queryResult, res)
    }
}

const seconIntentSwitchHandler = (firstIntent, previousParameter, queryResult, res) => {
    let processedQueryResult = {
        queryText: queryResult.queryText,
        parameters: previousParameter,
        secondSearchParameters: queryResult.parameters
    }
    switch(firstIntent){
        case 'keywordSearch':
            keywordSearchHandler(queryResult, res, true);
            break;
        case 'locationSearch':
            addressSearchHandler(processedQueryResult, res, true)
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
        default:
            return webhookReplyToTriggerIntent('backToWelcome', httpResponse);
    }
}