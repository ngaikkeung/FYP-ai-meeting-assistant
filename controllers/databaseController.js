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
                content: minuteObj.content
            }
            if(isConnected){
                database.collection("minutes").insertOne(documentToInsert, (err, res) => {
                    callback(err, res);
                })
            }else{
                callback(true, "DB is disconnected");
            }
        }

        
    }
}