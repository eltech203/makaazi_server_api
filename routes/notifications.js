const express = require('express');
const router = express.Router();
const { sendNotification } = require('../controllers/notificationsController');

router.post('/send', sendNotification); // Send a notification

module.exports = router;
