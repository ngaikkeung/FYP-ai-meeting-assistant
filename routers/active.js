const express = require('express');
const router = express.Router();
const activeController = require('../controllers/activeController');

// GET active page.
router.get('/', activeController.getActiveIndex);

router.post('/analysis', activeController.analysis)

module.exports = router;
