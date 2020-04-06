const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Receive webhook request from dialogflow
router.post('/', webhookController.handle);


module.exports = router;
