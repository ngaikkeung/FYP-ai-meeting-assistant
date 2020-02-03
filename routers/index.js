const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

// GET request to index page
router.get('/', indexController.getIndex);

module.exports = router;
