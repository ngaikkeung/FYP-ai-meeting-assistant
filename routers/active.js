const express = require('express');
const router = express.Router();
const activeController = require('../controllers/activeController');

// GET active page.
router.get('/', activeController.getActiveIndex);


module.exports = router;
