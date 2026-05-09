const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('./emailService');

/**
 * MedQuad Central Notification Service
 *
 * Simultaneously:
 * 1. Persists notification to MongoDB
 * 2. Emits real-time Socket.IO event to the recipient
 * 3. Sends a transactional email (if sendEmail: true)
 *
 * @param {Object} options
 * @param {string|string[]} options.recipientId  - User ObjectId(s) to notify
 * @param {string}   options.type       - Notification type enum
 * @param {string}   options.title      - Short title
 * @param {string}   options.message    - Full message body
 * @param {string}   [options.link]     - Deep link (default: '/')
 * @param {boolean}  [options.sendEmail]- Whether to also email (default: true)
 * @param {string}   [options.buttonText] - CTA button label for email
 * @param {Object}   [options.metadata] - Extra data (ticketId, expenseId, etc.)
 * @param {Object}   [options.io]       - Socket.IO server instance
 */
const notify = async ({
    recipientId,
    type,
    title,
    message,
    link = '/',
    sendEmail: shouldEmail = true,
    buttonText = 'View Details',
    metadata = {},
    io = null,
}) => {
    try {
        // Support single or multiple recipients
        const recipientIds = Array.isArray(recipientId) ? recipientId : [recipientId];

        for (const rid of recipientIds) {
            if (!rid) continue;

            // 1. Save to DB
            const notification = await Notification.create({
                recipient: rid,
                type,
                title,
                message,
                link,
                metadata,
                isEmailed: false,
            });

            // 2. Emit Socket.IO real-time event
            if (io) {
                io.to(`room:user:${rid.toString()}`).emit('newNotification', {
                    _id: notification._id,
                    type,
                    title,
                    message,
                    link,
                    isRead: false,
                    createdAt: notification.createdAt,
                });
            }

            // 3. Send email (async, non-blocking — failure won't crash the request)
            if (shouldEmail) {
                const user = await User.findById(rid).select('email name').lean();
                if (user?.email) {
                    sendEmail({
                        to: user.email,
                        title,
                        message: `Hi ${user.name},\n\n${message}`,
                        link,
                        buttonText,
                    }).then(async (sent) => {
                        if (sent) {
                            await Notification.findByIdAndUpdate(notification._id, { isEmailed: true });
                        }
                    }).catch((err) => {
                        console.error('[NotificationService] Email error:', err.message);
                    });
                }
            }
        }
    } catch (error) {
        // Never crash the main request due to notification failure
        console.error('[NotificationService] Failed to send notification:', error.message);
    }
};

/**
 * Convenience: Get all admin user IDs (for broadcasting to all admins)
 */
const getAdminIds = async () => {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
    return admins.map((a) => a._id);
};

module.exports = { notify, getAdminIds };
