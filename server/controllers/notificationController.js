const Notification = require('../models/Notification');

/**
 * @desc    Get notifications for current user
 * @route   GET /api/v1/notifications
 * @access  Authenticated
 */
const getNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, isRead, type } = req.query;
        const query = { recipient: req.user._id };

        if (isRead !== undefined) query.isRead = isRead === 'true';
        if (type) query.type = { $in: type.split(',') };

        const total = await Notification.countDocuments(query);
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                notifications,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    limit: parseInt(limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get unread notification count for badge
 * @route   GET /api/v1/notifications/unread-count
 * @access  Authenticated
 */
const getUnreadCount = async (req, res, next) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false,
        });
        res.status(200).json({ success: true, data: { count } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Authenticated (owner only)
 */
const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.status(200).json({ success: true, data: { notification } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/v1/notifications/read-all
 * @access  Authenticated
 */
const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );
        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Authenticated (owner only)
 */
const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user._id,
        });
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Test the notification pipeline for the current user
 * @route   POST /api/v1/notifications/test
 * @access  Authenticated
 */
const testNotification = async (req, res, next) => {
    try {
        const { notify } = require('../services/notificationService');
        const io = req.app.get('io');
        
        await notify({
            recipientId: req.user._id,
            type: 'general',
            title: 'Diagnostic Test Notification',
            message: `Hello ${req.user.name}, this is a test of the MedQuad Notification System.`,
            link: '/notifications',
            sendEmail: false,
            io,
        });

        res.status(200).json({
            success: true,
            message: 'Test notification sent successfully',
            data: {
                user: {
                    _id: req.user._id,
                    name: req.user.name,
                    role: req.user.role
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    testNotification,
};
