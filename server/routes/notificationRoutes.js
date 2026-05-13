const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    testNotification,
} = require('../controllers/notificationController');

// All routes require authentication
router.use(protect);

router.get('/',               getNotifications);
router.get('/unread-count',   getUnreadCount);
router.post('/test',          testNotification);
router.patch('/read-all',     markAllAsRead);
router.patch('/:id/read',     markAsRead);
router.delete('/:id',         deleteNotification);

module.exports = router;
