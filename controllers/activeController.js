/**
 * Active  controller
 */
require('dotenv').config();
const fetch = require('node-fetch')
const url =  process.env.NLP_API_KEY;
exports.getActiveIndex = (req, res) => {
    res.render('active');
}

exports.analysis = (req, res) => {
    console.log("Request body: ", req.body);
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({document: req.body.document })
    })
    .then(res => res.json())
    .then(json => {
        console.log(json);
        res.json(json);
    })
}

