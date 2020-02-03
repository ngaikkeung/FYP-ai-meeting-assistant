/**
 * Upload  controller
 */
const fs = require('fs');
const formidable = require('formidable');
const PDFParser = require("pdf2json");

exports.getUpload = (req, res) => {
    res.render('upload');
}

exports.postUpload = (req, res) => {
    console.log("upload router, post")
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if(err){
            return console.log("Parse form error: ", err);
        }
        let pdfParser = new PDFParser(this,1);
        pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
        pdfParser.on("pdfParser_dataReady", pdfData => {
            let fileName = `./${files.minute.name.substring(0, files.minute.name.indexOf("."))}.json`;
            fs.writeFile(fileName, JSON.stringify(pdfData));
            res.json({"data": pdfData});
        });
        pdfParser.loadPDF(files.minute.path);

        
    })
}
