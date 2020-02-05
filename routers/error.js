const express = require('express');
const router = express.Router();
const errorController = require('../controllers/errController');

// 404 page.
router.get('/', errorController.err);


module.exports = router;
