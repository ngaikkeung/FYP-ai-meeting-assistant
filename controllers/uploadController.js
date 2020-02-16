/**
 * Upload  controller
 * 
 * The parsed PDF json library documentation:
 * https://www.npmjs.com/package/pdf2json
 * 
 */
const fs = require('fs');
const formidable = require('formidable');
const PDFParser = require("pdf2json");

const PERSON_PREFIX = ['Mr', 'Ms', 'Miss', 'Dr', 'Ir'];
const PERSON_TITLE = ['JP', 'MH', 'SBS', 'BBS'];
const PDF_LINE_HEIGHT = 1.125;
const PDF_LINE_START_X_COORIDNATE = 5.714;
let minute = {
    'namOfMeeting' : null,
    'count' : null,
    'date' : null,
    'time' : null,
    'venue' : null,
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
    let pdfJson;
    form.parse(req, (err, fields, files) => {
        if(err){
            return console.log("Parse form error: ", err);
        }
        let pdfParser = new PDFParser(this,1);
        pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
        pdfParser.on("pdfParser_dataReady", pdfData => {
            let fileName = `./${files.minute.name.substring(0, files.minute.name.indexOf("."))}.json`;
            // fs.writeFile(fileName, JSON.stringify(pdfData));
            // res.json({"data": pdfData});
            pdfJson = pdfData.formImage;
            minuteObject = extractTitleCountDateOfMeeting(pdfJson);
            // extractPerson(pdfJson);
            // extractPersonWithPosition(pdfJson);
            res.send(JSON.stringify(minuteObject, null, '\t'));
        });
        pdfParser.loadPDF(files.minute.path);
    })
}

/**
 * Extract the data of meeting from parsed JSON.
 * 
 * Minute title indexed at the 1st, 2ed line and 1st page of parsed JSON.
 * Minute count indexed at the 3th line and 1st page of parsed JSON.
 * Minute date, time, venue indexed at following line.
 * 
 * @param {Object} pdfJson the parsed JSON of pdf data.
 */
const extractTitleCountDateOfMeeting = (pdfJson) => {
    let title = pdfJson.Pages[0].Texts[0].R[0].T + 
                pdfJson.Pages[0].Texts[1].R[0].T;
    let date = decodeURIComponent(pdfJson.Pages[0].Texts[3].R[0].T);
    let time = decodeURIComponent(pdfJson.Pages[0].Texts[5].R[0].T).replace('.', '');

    let venue = decodeURIComponent(pdfJson.Pages[0].Texts[7].R[0].T);
    let xCoordinatesOfVenue = pdfJson.Pages[0].Texts[6].x;
    let xCoordinatesOfNextLineOfVenue = pdfJson.Pages[0].Texts[8].x;

    // If next line of venue is not started from same x coordinate, that mean next line also is venue.
    if(xCoordinatesOfVenue != xCoordinatesOfNextLineOfVenue){
        venue += decodeURIComponent(pdfJson.Pages[0].Texts[8].R[0].T);
    }

    minute.namOfMeeting = decodeURIComponent(title);
    minute.count = findDigitInString(minute.namOfMeeting);
    minute.date = Date.parse(date.substring(0, date.indexOf('(')));
    minute.time = Date.parse((date.substring(0, date.indexOf('(')) + time));
    minute.venue = venue;
    
    return new Minute(minute.namOfMeeting, minute.count, minute.date, minute.time, minute.venue);
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

const extractPerson = (pdfJson) => {
    let personListfPageNumberAboveSecretary = 0;
    let personListYCoordinateAboveSecretary = 0;
    let personList = [];
    let person = {
        'name' : '',
        'title' : [],
        'position' : ''
    }

    /**
     * TS array: [fontFaceId, fontSize, 1/0 for bold, 1/0 for italic]
     * From documentation.
     */
    PageKeyLoop:
        for(let pageKey in pdfJson.Pages){
            for(let text of pdfJson.Pages[pageKey].Texts){
                // Text contains first "Secretary" and index at the start of a line is the location of Secretary.
                if(decodeURIComponent(text.R[0].T).indexOf("Secretary") != -1 && text.x == PDF_LINE_START_X_COORIDNATE){
                    personListfPageNumberAboveSecretary = pageKey;
                    personListYCoordinateAboveSecretary = text.y;
                    break PageKeyLoop;
                }
            }
        }

    PDF_PAGE_LOOP:
        for(let pageKey = 0; pageKey <= personListfPageNumberAboveSecretary; pageKey++){
            let sameLineYCoordinate = null;
            
            for(let textKey in pdfJson.Pages[pageKey].Texts){
                let textContent = decodeURIComponent(pdfJson.Pages[pageKey].Texts[textKey].R[0].T);
                let currentTextContentYCoordinate = pdfJson.Pages[pageKey].Texts[textKey].y;
                let nextTextContentYCoordinate = (pdfJson.Pages[pageKey].Texts[parseInt(textKey) + 1] != undefined ? pdfJson.Pages[pageKey].Texts[parseInt(textKey) + 1].y : null);
                
                console.log("textContent: ", textContent);
                console.log("current text Y coor: ", currentTextContentYCoordinate);
                console.log("next Text Content Y Coordinate: ", nextTextContentYCoordinate);
                console.log("sameLineYCoordinate: ", sameLineYCoordinate);

                // Check name until the last page of person list and y coordinate after "The Chairmen"
                if(pageKey == personListfPageNumberAboveSecretary && currentTextContentYCoordinate >= personListYCoordinateAboveSecretary){
                    console.log("END OF LOOP: ", pageKey, currentTextContentYCoordinate);
                    break PDF_PAGE_LOOP;
                }

            for(let prefix of PERSON_PREFIX){
                    // Text contains one of PERSON_PREFIX
                    if(textContent.indexOf(prefix) != -1){
                        sameLineYCoordinate = currentTextContentYCoordinate;
                        person.name = '';
                        person.title = [];
                        person.position = '';
                        // console.log("Name found, Set sameLineYCoordinate: ", sameLineYCoordinate);
                        break; // break the prefix checking loop
                    }
            }

            // Check current text is same line of name and Text not include "(" part
            if(sameLineYCoordinate != null && currentTextContentYCoordinate == sameLineYCoordinate){
                    if(textContent.indexOf('(Arrived') == -1 && textContent.indexOf('(Left') == -1){
                        person.name += textContent;
                        console.log("person name: ", person.name)
                    }
                    if(currentTextContentYCoordinate != nextTextContentYCoordinate){
                        person.name = person.name.substring(person.name.indexOf(' '));
                        
                        /**
                         *  loop to remove title, e.g BBS, MH
                         *  "PUN Kwok-wah, JP", index of title and the preivous 2 position ", JP"
                         */
                        for(let title of PERSON_TITLE){
                            if(person.name.indexOf(title) != -1){
                                person.name = person.name.substring(0, person.name.indexOf(title)-2);
                                person.title.push(title);
                            }
                        }
                        person.name = person.name.trim();
                        personList.push(new Person(person.name, person.title));
                    }
            }else{
                sameLineYCoordinate = null;
                console.log("Set y coor null");
            }
            console.log("Person list: ", personList);
            console.log("------------------------------------")
            }
        }
}

const extractPersonWithPosition = (pdfJson) => {
    const PERSON_NAME_BELOW_SECRETARY_Y_COORIDNATE = 0;
    const POSITION_BELOW_SECRETARY_Y_COORIDNATE = 0;
    let personListStartOfPageNumber = 0;
    let personListStartOfYCoordinate = 0
    let personListEndOfPageNumber = 0;
    let personListEndOfYCoordinate = 0;
    let personList = [];
    let person = {
        'name' : '',
        'title' : [],
        'position' : ''
    }

    /**
     * TS array: [fontFaceId, fontSize, 1/0 for bold, 1/0 for italic]
     * From documentation.
     */
    PageKeyLoop:
        for(let pageKey in pdfJson.Pages){
            for(let textKey in pdfJson.Pages[pageKey].Texts){
                let text = pdfJson.Pages[pageKey].Texts[textKey];
                let nextText = pdfJson.Pages[pageKey].Texts[parseInt(textKey) + 1];

                // Text contains first "Secretary" and index at the start of a line is the location.
                if(decodeURIComponent(text.R[0].T).indexOf("Secretary") != -1 && text.x == PDF_LINE_START_X_COORIDNATE){
                    personListStartOfPageNumber = pageKey;
                    personListStartOfYCoordinate = text.y;

                    // Text contains ":" and index at the next texts of a line is the y coordinate of person name.
                    if(decodeURIComponent(nextText.R[0].T).indexOf(":") != -1){

                    }
                }
                // Text contains first bold "The" is the end page of person list.
                if(decodeURIComponent(text.R[0].T).indexOf("The") != -1 && text.R[0].TS[2] == 1){
                    personListEndOfPageNumber = pageKey;
                    personListEndOfyCoordinate = text.y;
                    break PageKeyLoop;
                }
            }
        }


    console.log("personListStartOfPageNumber", personListStartOfPageNumber);
    console.log("personListStartOfYCoordinate", personListStartOfYCoordinate);
    console.log("personListEndOfPageNumber", personListEndOfPageNumber);
    console.log("personListEndOfYCoordinate", personListEndOfYCoordinate);

    
    PDF_PAGE_LOOP:
        for(let pageKey = 0; pageKey <= personListEndOfPageNumber; pageKey++){
            let sameLineYCoordinate = null;
            
            for(let textKey in pdfJson.Pages[pageKey].Texts){
                let textContent = decodeURIComponent(pdfJson.Pages[pageKey].Texts[textKey].R[0].T);
                let currentTextContentYCoordinate = pdfJson.Pages[pageKey].Texts[textKey].y;
                let nextTextContentYCoordinate = (pdfJson.Pages[pageKey].Texts[parseInt(textKey) + 1] != undefined ? pdfJson.Pages[pageKey].Texts[parseInt(textKey) + 1].y : null);
                
                console.log("textContent: ", textContent);
                console.log("current text Y coor: ", currentTextContentYCoordinate);
                console.log("next Text Content Y Coordinate: ", nextTextContentYCoordinate);
                console.log("sameLineYCoordinate: ", sameLineYCoordinate);

                // Check name until the last page of person list and y coordinate after "The Chairmen"
                if(pageKey == personListEndOfPageNumber && currentTextContentYCoordinate >= personListEndOfYCoordinate){
                    console.log("END OF LOOP: ", pageKey, currentTextContentYCoordinate);
                    break PDF_PAGE_LOOP;
                }

            for(let prefix of PERSON_PREFIX){
                    // Text contains one of PERSON_PREFIX
                    if(textContent.indexOf(prefix) != -1){
                        sameLineYCoordinate = currentTextContentYCoordinate;
                        person.name = '';
                        person.title = [];
                        person.position = '';
                        // console.log("Name found, Set sameLineYCoordinate: ", sameLineYCoordinate);
                        break; // break the prefix checking loop
                    }
            }

            // Check current text is same line of name and Text not include "(" part
            if(sameLineYCoordinate != null && currentTextContentYCoordinate == sameLineYCoordinate){
                    if(textContent.indexOf('(Arrived') == -1 && textContent.indexOf('(Left') == -1){
                        person.name += textContent;
                        console.log("person name: ", person.name)
                    }
                    if(currentTextContentYCoordinate != nextTextContentYCoordinate){
                        person.name = person.name.substring(person.name.indexOf(' '));
                        
                        /**
                         *  loop to remove title, e.g BBS, MH
                         *  "PUN Kwok-wah, JP", index of title and the preivous 2 position ", JP"
                         */
                        for(let title of PERSON_TITLE){
                            if(person.name.indexOf(title) != -1){
                                person.name = person.name.substring(0, person.name.indexOf(title)-2);
                                person.title.push(title);
                            }
                        }
                        person.name = person.name.trim();
                        personList.push(new Person(person.name, person.title));
                    }
            }else{
                sameLineYCoordinate = null;
                console.log("Set y coor null");
            }
            console.log("Person list: ", personList);
            console.log("------------------------------------")
            }
        }
}

class Minute{
    constructor(nameOfMeeting = null , count = 0, date = null, time = null, venue = null, content = null){
        this.nameOfMeeting = nameOfMeeting;
        this.count = count;
        this.date = date;
        this.time = time;
        this.venue = venue;
        this.content = content;
    }
}

class Person {
    constructor(name = null, title = [], position = null) {
        this.name = name;
        this.title = [...title];
        this.position = position;
    }
}
