/**
 * Upload  controller
 * 
 * The parsed PDF json library documentation:
 * https://www.npmjs.com/package/pdf2json
 * 
 */
const formidable = require('formidable');
const DB = new (require('./databaseController.js'))();
const fs = require('fs');
const pdf = require('pdf-parse');

const PERSON_PREFIX = ['Mr', 'Ms', 'Miss', 'Dr', 'Ir'];
const PERSON_TITLE = ['JP', 'MH', 'SBS', 'BBS'];
let minute = {
    'title' : null,
    'numberOfMeeting' : null,
    'date' : null,
    'time' : null,
    'venue' : null,
    'content' : null,
    // 'present' : null,
    // 'absent' : null,
    // 'inAttendance' : null,
    // 'invitAttendance' : null,
    // 'instruction' : null,
    // 'discussion' : nully
}


exports.getUpload = (req, res) => {
    res.render('upload');
}

exports.postUpload = (req, res) => {
    const form = new formidable.IncomingForm();
    let pdfData = null;
    form.parse(req, (err, fields, files) => {
        if(err){
            return console.log("Parse form error: ", err);
        }
        let dataBuffer = fs.readFileSync(files.minute.path);
 
        pdf(dataBuffer).then(function(data) {
            // PDF text
            pdfData = data.text;
            pdfBasicInfoPartText = pdfData.substring(pdfData.indexOf("Minutes"), pdfData.indexOf("Present"));
            endPartOfText = pdfData.substring(pdfData.indexOf("*")).replace(/\n \n/g, "").replace(/\n/g, "");
            minute.content = endPartOfText;
            extractBasicInforOfMeeting(pdfBasicInfoPartText);

            DB.uploadMinute(minute, (err, res) => {
                if(err){
                    console.log("DB insert failed. ", err);
                }else{
                    if(res){
                        console.log("DB insert minute success!")
                    }else{
                        console.log("DB insert minute failed!")
                        
                    }
                }
            })
            res.json(minute);
        });
    })
}


/**
 * Extract the basic information from a parsed text minute.
 * @param {String} text The parsed text data from pdf file.
 */
const extractBasicInforOfMeeting = (text) => {
    let title = text.substring(text.indexOf("Minutes"), text.indexOf("Date:")).trim().replace(/\r?\n|\r/g, "");
    let date = text.substring(text.indexOf("Date:") + 5, text.indexOf("Time:")).trim();
    let time = text.substring(text.indexOf("Time:") + 5, text.indexOf("Venue:")).trim().replace('.', '');
    let venue = text.substring(text.indexOf("Venue:") + 6).trim();

    minute.title = title;
    minute.numberOfMeeting = findDigitInString(minute.title);
    minute.date = Date.parse(date.substring(0, date.indexOf('(')));
    minute.time = Date.parse((date.substring(0, date.indexOf('(')) + time));
    minute.venue = venue;
}

/**
 * Return the first digit in the string.
 * 
 * @param {String} string The string gonna find the digit.
 * 
 * @return {Number} Return the first digit in the string.
 */
const findDigitInString = (string) => {
    // on or more digits in Regular expressions.
    let r = /\d+/g;
    let matchResult = string.match(r);
    if(matchResult == null)
        return null;
    return parseInt(matchResult[0]);
}
