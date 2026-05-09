const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: [
                'ticket_created',
                'ticket_assigned',
                'ticket_updated',
                'ticket_resolved',
                'expense_submitted',
                'expense_approved',
                'expense_rejected',
                'equipment_down',
                'equipment_added',
                'inventory_low',
                'ai_critical_alert',
                'general',
            ],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        link: {
            type: String,
            default: '/',
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        isEmailed: {
            type: Boolean,
            default: false,
        },
        metadata: {
            type: Object,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for fast unread-count queries per user
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
