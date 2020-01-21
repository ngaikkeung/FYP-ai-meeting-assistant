const app = require('express');
const router = app.Router();

// Set router path
router.get('/',(req,res) => {
        res.render('index');
    })
    .get('/active', (req, res) => {
        res.render('active');
    })
    .get('*', (req, res) => {
        res.render('error', {
            errTitle: '404 error',
            errMsg: 'Page not found.'
        });
    })






module.exports = router;
