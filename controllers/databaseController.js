require('dotenv').config();
const MongoClient = require("mongodb").MongoClient;
const url =  process.env.MONGODB_URL;
const dbName =  process.env.DB_NAME;
const ObjectId = require('mongodb').ObjectID;

module.exports = class DB{
    constructor(){
        let database = null;
        let isConnected = false; 

        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, db) => {
            if(err){
                console.log("MongoClient connect err! ", err);
            }else{
                // console.log("MongoClient connect Success! ");
                isConnected = true;
                database = db.db(dbName);
            }
        })

        this.uploadMinute = (minuteObj, callback) => {
            let documentToInsert = {
                _id: ObjectId(),
                title: minuteObj.title,
                pdf_id: minuteObj.pdf_id,
                numberOfMeeting: minuteObj.numberOfMeeting,
                date: minuteObj.date,
                time: minuteObj.time,
                venue: minuteObj.venue,
                content: minuteObj.content,
                items: minuteObj.items
            }
            if(isConnected){
                database.collection("minutes").insertOne(documentToInsert, (err, res) => {
                    callback(err, res);
                })
            }else{
                callback(true, "DB is disconnected");
            }
        }

        this.uploadMinutePDF = (pdfObj, callback) => {
            if(isConnected){
                database.collection("pdf").insertOne(pdfObj, (err, res) => {
                    callback(err, res);
                })
            }else{
                callback(true, "DB is disconnected");
            }
        }

        this.getPDF = (id, callback) => {
            if(isConnected){
                let params = {
                    '_id': new ObjectId(id)
                }
                database.collection("pdf").findOne(params, (err, res) => {
                    callback(err, res);
                });
            }else{
                callback(true, "DB is disconnected");
            }
        }

        this.search = (analysisEntities, callback) => {
            let entities = [];
            let response = {};

            for(let object of analysisEntities){
                entities.push(object.name)
            }

            if(isConnected){
                loopSearch(entities, database, (result) => {
                    console.log("RESULT: ", result);
                })
            }else{
                callback(true, "DB is disconnected");
            }
        }
        
        this.searchMinutesByAnyKeyword = (any, callback) => {
            let search = { 
                $text: { 
                    $search: any 
                }
            } 

            return database.collection("minutes").find(search).project({ score: { $meta: "textScore" } }).sort( { score: { $meta: "textScore" } } ).toArray((error, items) => {
                callback(error, items);
            })
        }

        this.searchMinutesByPeiod = (period, callback) => {
            let search = { 
                date: {
                    $gte: new Date(period.startDate).getTime(),
                    $lte: new Date(period.endDate).getTime()
                }
            } 

            return database.collection("minutes").find(search).toArray((error, items) => {
                callback(error, items);
            })
        }

        /** The period date is in millisecond format */
        this.searchMinutesByPeiodMillisecond = (period, callback) => {
            let search = { 
                date: {
                    $gte: parseInt(period.startDate),
                    $lte: parseInt(period.endDate),
                }
            } 

            return database.collection("minutes").find(search).toArray((error, items) => {
                callback(error, items);
            })
        }

        this.searchMinutesByNumberOfMeeting = (payload, callback) => {
            if(payload.timeWord && !payload.number){
                return database.collection("minutes").find({}).sort({numberOfMeeting: -1}).limit(1).toArray((error, items) => {
                    callback(error, items);
                })
            }else if(payload.timeWord && payload.number){
                return database.collection("minutes").find({}).sort({numberOfMeeting: -1}).limit(parseInt(payload.number)).toArray((error, items) => {
                    return callback(error, items);
                })
            }else{
                return database.collection("minutes").find({}).sort({numberOfMeeting: -1}).toArray((error, items) => {
                    return callback(error, items);
                })
            }
        }

        this.searchMinutesByAnyKeywordPeriod = (payload, callback) => {
            let aggregateArray = [
                {
                    $match: {
                        $and:[
                            {
                                $text: {
                                        $search: payload.keyword 
                                    }
                            },
                            {
                                date:{
                                    $gte: new Date(payload.period.startDate).getTime(),
                                    $lte: new Date(payload.period.endDate).getTime()
                                }
                            }
                        ]
                    }
                },
                {
                    $sort: {
                        score: {
                            $meta: "textScore"
                        }
                    }
                }
            ]
           
            return database.collection("minutes").aggregate(aggregateArray).toArray((error, items) => {
                callback(error, items);
            })
        }

        /** The period date is in millisecond format */
        this.searchMinutesByAnyKeywordPeriodMillisecond = (payload, callback) => {
            let aggregateArray = [
                {
                    $match: {
                        $and:[
                            {
                                $text: {
                                        $search: payload.keyword 
                                    }
                            },
                            {
                                date:{
                                    $gte: parseInt(payload.period.startDate),
                                    $lte: parseInt(payload.period.endDate)
                                }
                            }
                        ]
                    }
                },
                {
                    $sort: {
                        score: {
                            $meta: "textScore"
                        }
                    }
                }
            ]
           
            return database.collection("minutes").aggregate(aggregateArray).toArray((error, items) => {
                callback(error, items);
            })
        }

        this.searchMinutesByTwoKeyword = (payload, callback) => {
            let aggregate = [
                {
                    $match: {
                        $text: {
                            $search: payload[0]
                        }
                    }
                },
                { 
                    $addFields: { 
                        results: { 
                            $regexMatch: { 
                                input: "$content", 
                                regex: new RegExp(payload[1], "i") 
                            }  
                        } 
                    } 
                }, 
                {
                    $match: {
                        results: true
                    }
                },
                {
                    $project: {
                        results: 0
                    }
                },
                {
                    $sort: {
                        score: {
                            $meta: "textScore"
                        }
                    }
                }
            ];

            return database.collection("minutes").aggregate(aggregate).toArray((error, items) => {
                callback(error, items);
            })
        }

        this.searchMinutesByNumberingAndKeyword = (payload, callback) => {
            let search = {
                $match: {
                    $text: {
                        $search: payload.keyword
                    }
                }
            }
            let sorting = {
                $sort: {
                    numberOfMeeting: -1
                }
            }
            let aggregateArray = [search, sorting]

            if(payload.timeWord && !payload.number){
                let limit = {
                    $limit: 1
                }
                aggregateArray.push(limit)
                
                return database.collection("minutes").aggregate(aggregateArray).toArray((error, items) => {
                    callback(error, items);
                })
            }else if(payload.timeWord && payload.number){
                let limit = {
                    $limit: parseInt(payload.number)
                }
                aggregateArray.push(limit)

                return database.collection("minutes").aggregate(aggregateArray).toArray((error, items) => {
                    callback(error, items);
                })
            }else{
                return database.collection("minutes").aggregate(aggregateArray).toArray((error, items) => {
                    callback(error, items);
                })
            }
        }
    }
}

const loopSearch = (entities, db, callback) => {
    let dbSearchCount = 0;
    let result = [];
    for(let i = 0; i < entities.length; i++){
        let search = {
            $text: {
                $search: `${entities[i]}`
            }
        };
        console.log("Seacrh: ", search);
        db.collection("minutes").find(search).toArray((err, documents) => {
            if(err){
                console.log("DB Search err:", err);
                return err;
            }
            for(let doc of documents){
                result.push(doc);
            }
            dbSearchCount++;
            console.log("db count: ", dbSearchCount)
        })
    }
    if(dbSearchCount == entities.length){
        return callback(result)
    }else{
        console.log("END")
    }
    console.log("END2")
}
