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
            console.log("Connect mongo url: ", url)
            if(err){
                console.log("MongoClient connect err! ", err);
            }else{
                console.log("MongoClient connect Success! ");
                isConnected = true;
                database = db.db(dbName);
            }
        })

        this.uploadMinute = (minuteObj, callback) => {
            let documentToInsert = {
                _id: ObjectId(),
                title: minuteObj.title,
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
