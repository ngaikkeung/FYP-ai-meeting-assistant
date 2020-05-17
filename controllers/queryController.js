const DB = new (require('./databaseController.js'))();

exports.resultsPage = (req, res) => {
    if(isValidQuery(req.query)){
        let intent = req.query.intent
        let isSecondIntent = req.query.isSecondIntent
        let payload = {}

        if(!isSecondIntent){
            switch(intent){
                case 'keywordSearch':
                    DB.searchMinutesByAnyKeyword(req.query.keyword, (err, results) => {
                        if(err){
                            return errorPage(res)
                        }
                        console.log("results: ",results.length);
                        return resultsPage(results, res)
                    })
                    break;
                case 'locationSearch':
                    DB.searchMinutesByAnyKeyword(req.query.keyword, (err, results) => {
                        if(err){
                            return errorPage(res)
                        }
                        console.log("results: ",results.length);
                        return resultsPage(results, res)
                    })
                    break;
                case 'numberingSearch':
                    payload = {
                        timeWord: req.query.time,
                        number: req.query.number
                    }
                    DB.searchMinutesByNumberOfMeeting(payload, (err, results) => {
                        if(err){
                            return errorPage(res)
                        }
                        console.log("results: ",results.length);
                        return resultsPage(results, res)
                    })
                    break;
                case 'periodSearch':
                case 'dateSearch':
                    payload = {
                        startDate: req.query.startDate,
                        endDate: req.query.endDate
                    }
                    DB.searchMinutesByPeiodMillisecond(payload, (err, results) => {
                        if(err){
                            return errorPage(res)
                        }
                        console.log("results: ",results.length);
                        return resultsPage(results, res)
                    })
                    break;
                default:
                    return errorPage(res)
            }
        }else{

        }
    }else{
        return errorPage(res)
    }
}

const errorPage = (res) => {
    return res.render('error', {
        errTitle: '404 error',
        errMsg: 'Page not found.'
    });
}

const resultsPage = (results, res) => {
    return res.render('results', {
        results: results
    });
}

const isValidQuery = (query) => {
    let intent = query.intent
    let isSecondIntent = query.isSecondIntent
    let intentRequired = ['keywordSearch', 'numberingSearch', 'periodSearch', 'dateSearch']
    let oneIntentRequiredParm = {
        'keywordSearch': ['intent', 'keyword'],
        'numberingSearch': ['intent', 'time', 'number'],
        'periodSearch': ['intent', 'startDate', 'endDate'],
        'dateSearch': ['intent', 'startDate', 'endDate']
    };
    let twoIntentRequiredParm = {
        'keywordSearch': ['intent', 'keyword1', 'keyword2', 'isSecondIntent'],
        'numberingSearch': ['intent', 'time', 'number', 'keyword', 'isSecondIntent'],
        'periodSearch': ['intent', 'startDate', 'endDate', 'keyword', 'isSecondIntent'],
        'dateSearch': ['intent', 'startDate', 'endDate', 'keyword', 'isSecondIntent']
    };

    if(!intent || !intentRequired.includes(intent)){
        console.log("Intent not match or missing.");
        return false;
    }

    if(!isSecondIntent){
        for(let params of oneIntentRequiredParm[intent]){
            if(!query[params]){
                console.log(`Query parms: ${params} missing.`);
                console.log('Query: ', query);
                return false
            }
        }
    }else{
        for(let params of twoIntentRequiredParm[intent]){
            if(!query[params]){
                console.log(`Query parms: ${params} missing.`);
                console.log('Query: ', query);
                return false
            }
        }
    }
   
    return true;
}