const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// GET requert to upload page
router.get('/', uploadController.getUpload);

// POST requert to upload PDF
router.post('/', uploadController.postUpload);


module.exports = router;
