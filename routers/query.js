const express = require('express');
const router = express.Router();
const queryController = require('../controllers/queryController');

// query search handle
router.get('/', queryController.resultsPage);

// single document
// router.get('/document/:id', queryController.documentPage);

module.exports = router;
