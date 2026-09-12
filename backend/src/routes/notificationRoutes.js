const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/notifications
router.get('/', authenticateToken, (req, res) => {
  const user = req.user;
  const notifications = db.notifications.find(n =>
    n.recipientId === user.id ||
    n.recipientRole === user.role ||
    !n.recipientRole
  );

  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const unreadCount = notifications.filter(n => !n.isRead).length;

  res.json({
    success: true,
    unreadCount,
    notifications
  });
});

// PATCH /api/notifications/:id/read - Mark single as read
router.patch('/:id/read', authenticateToken, (req, res) => {
  const notif = db.notifications.findById(req.params.id);
  if (!notif) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }

  const updated = db.notifications.updateById(notif.id, { isRead: true });
  res.json({ success: true, notification: updated });
});

// POST /api/notifications/read-all - Mark all as read
router.post('/read-all', authenticateToken, (req, res) => {
  const user = req.user;
  const userNotifs = db.notifications.find(n =>
    n.recipientId === user.id ||
    n.recipientRole === user.role
  );

  userNotifs.forEach(n => {
    db.notifications.updateById(n.id, { isRead: true });
  });

  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = router;

