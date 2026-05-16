const mongoose = require('mongoose');

const ticketUpdateSchema = new mongoose.Schema(
    {
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['open', 'assigned', 'in-progress', 'on-hold', 'resolved', 'closed'],
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const serviceTicketSchema = new mongoose.Schema(
    {
        ticketNumber: {
            type: String,
            unique: true,
        },
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: [true, 'Client is required'],
        },
        equipmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Equipment',
            required: [true, 'Equipment is required'],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator is required'],
        },
        assignedEmployee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        status: {
            type: String,
            enum: {
                values: ['open', 'assigned', 'in-progress', 'on-hold', 'resolved', 'closed'],
                message: 'Invalid ticket status',
            },
            default: 'open',
        },
        priority: {
            type: String,
            enum: {
                values: ['low', 'medium', 'high', 'critical'],
                message: 'Priority must be one of: low, medium, high, critical',
            },
            default: 'medium',
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            minlength: [10, 'Description must be at least 10 characters'],
        },
        // AI-populated fields (Phase 3)
        aiCategory: {
            type: String,
            default: null,
        },
        aiPriorityScore: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },
        // NLP v2.0 — few-shot classification outputs
        aiConfidence: {
            type: Number,
            min: 0,
            max: 1,
            default: null,
        },
        aiReasoning: {
            type: String,
            default: null,
        },
        aiUrgencyKeywords: {
            type: [String],
            default: [],
        },
        // AI-suggested employee from routing engine
        suggestedEmployee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        aiRoutingReasoning: {
            type: String,
            default: null,
        },
        updates: [ticketUpdateSchema],
        resolvedAt: {
            type: Date,
            default: null,
        },
        closedAt: {
            type: Date,
            default: null,
        },
        estimatedResponseTime: {
            type: String,
            default: null,
        },
        // Sentiment Analysis — runs on client updates
        sentimentScore: {
            type: Number,  // -1.0 (very negative) to 1.0 (very positive)
            default: null,
        },
        escalationFlag: {
            type: Boolean,
            default: false,
        },
        escalationReason: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        strict: true,
    }
);

// Auto-generate ticket number before saving
serviceTicketSchema.pre('save', async function (next) {
    if (!this.ticketNumber) {
        const ts = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
        this.ticketNumber = `MQ-${ts}-${rand}`;
    }
    // Auto-set resolvedAt when status changes to resolved
    if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
        this.resolvedAt = new Date();
    }
    if (this.isModified('status') && this.status === 'closed' && !this.closedAt) {
        this.closedAt = new Date();
    }
    next();
});

serviceTicketSchema.index({ clientId: 1 });
serviceTicketSchema.index({ equipmentId: 1 });
serviceTicketSchema.index({ assignedEmployee: 1 });
serviceTicketSchema.index({ status: 1 });
serviceTicketSchema.index({ priority: 1 });
serviceTicketSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ServiceTicket', serviceTicketSchema);
