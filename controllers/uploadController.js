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

exports.getUpload = (req, res) => {
    res.render('upload');
}

exports.postUpload = (req, res) => {
    let minute = {
        'title' : null,
        'numberOfMeeting' : null,
        'date' : null,
        'time' : null,
        'venue' : null,
        'content' : null,
        'items' : []
    }
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
            pdfBasicInfoPartText = pdfData.substring(pdfData.indexOf("Minutes"), pdfData.indexOf("Present")).replace(/ +/g, " ");
            endPartOfText = pdfData.substring(pdfData.indexOf("*")).replace(/ +/g, " ");
            minute.content = endPartOfText.replace(/\n \n/g, "").replace(/\n/g, "");
            extractBasicInforOfMeeting(pdfBasicInfoPartText, minute);
            extractItemOfMeeting(endPartOfText, minute)
            
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
 * @param {Object} minute The minute object to store the processed data.
 */
const extractBasicInforOfMeeting = (text, minute) => {
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
 * Extract the item title information from a parsed text minute.
 * 
 * How to define item title it is.
 * 1. Current string is a paragraph between '\n \n' and '\n \n'.
 * 2. First character is upper case character.
 * 3. Next paragraph first character is digit.
 * 4. Title sentence has no dot in the end. 
 * 
 * Exception Case:
 * The Chairman welcome speech need to ignore.
 * 
 * @param {String} text The minute string.
 * @param {Object} minute The minute object to store the processed data.
 */
const extractItemOfMeeting = (text, minute) => {
    let currentString = "";
    let nextStartOfString = "";
    let currentIndex = text.indexOf("\n \n");
    let nextIndex = text.indexOf("\n \n", ++currentIndex);

    for(let i = 0; ; i++){
        currentString = text.substring(currentIndex, nextIndex);
        nextStartOfString = text.substring(nextIndex + 3, nextIndex + 4);
        
        currentString = currentString.replace(/\n \n/g, "").replace(/\n/g, "").trim();

        // Update index
        currentIndex = nextIndex;
        nextIndex = text.indexOf("\n \n", ++currentIndex);

        if(currentString.indexOf("Chairman") != -1 && currentString.indexOf("welcomed") != -1 && currentString.indexOf("Members") != -1){
            continue;
        }

        
        if(isNaN(currentString.substring(0, 1)) && isAlphaAndUpperCase(currentString.substring(0, 1)) && !isNaN(nextStartOfString) && currentString.slice(-1) != "."){
            let item = {
                title: null,
                content: null,
            };

            item.title = currentString;
            minute.items.push(item);
        }
    
        if(nextIndex == -1){
            break;
        }
    }
    
}


/**
 * Return true if character is alpha and is upper case.
 * @param {String} character The character to check.
 */
const isAlphaAndUpperCase = (character) => {
    return /^[A-Z]$/i.test(character) && character == character.toUpperCase();
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
