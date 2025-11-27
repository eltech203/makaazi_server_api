const redisClient = require('../config/redis');

// Send Notification
exports.sendNotification = (req, res) => {
    const { message } = req.body;
    redisClient.publish('notifications', message, (err, reply) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Notification sent', reply });
    });
};
