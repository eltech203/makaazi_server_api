const redisClient = require('../config/redis');
const { sendNotification } = require("../utils/notify");

// Send Notification
exports.sendNotification = async (req, res) => {
    const { message } = req.body;
    redisClient.publish('notifications', message, (err, reply) => {
        if (err) return res.status(500).json({ error: err.message });
        sendNotification({
                user_uid: req.body.uid,
                user_type: "USER",
                title: req.body.title,
                message: req.body.message,
                type:  "SYSTEM",
                });
       return res.json({ message: 'Notification sent', reply });
    });
};


exports.getNotifications = async (req, res) => {
  const { uid } = req.params;

  db.query(
    `
    SELECT *
    FROM notifications
    WHERE user_uid = ?
    ORDER BY created_at DESC
    `,
    [uid],
    (err, rows) => {
      if (err)
        return res.status(500).json({ message: "DB error" });

      res.json(rows);
    }
  );
};
